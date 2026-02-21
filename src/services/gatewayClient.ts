/**
 * Gateway WebSocket Client
 * Implements the OpenClaw Gateway WS protocol v3
 * 
 * Protocol: JSON frames over WebSocket
 * - Request:  { type: "req", id, method, params }
 * - Response: { type: "res", id, ok, payload | error }
 * - Event:    { type: "event", event, payload, seq?, stateVersion? }
 * 
 * Handshake: connect.challenge → connect → hello-ok
 */

type ReqId = string;
type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
type EventHandler = (event: string, payload: unknown) => void;

export interface GatewayClientOpts {
  url: string;
  token?: string;
  password?: string;
  onHello?: (payload: HelloPayload) => void;
  onEvent?: EventHandler;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: string) => void;
  onReconnecting?: (attempt: number, delayMs: number) => void;
  onPairingRequired?: () => void;
  requestTimeoutMs?: number;
}

export interface HelloPayload {
  type: 'hello-ok';
  protocol: number;
  policy?: { tickIntervalMs?: number };
  auth?: {
    deviceToken?: string;
    role?: string;
    scopes?: string[];
  };
  [key: string]: unknown;
}

export interface ChatEvent {
  runId: string;
  sessionKey: string;
  seq: number;
  state: 'delta' | 'final' | 'aborted' | 'error';
  message?: unknown;
  errorMessage?: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  stopReason?: string;
}

export interface GatewayError {
  code?: string;
  message: string;
}

// ========== Device Auth Helpers (Ed25519 via WebCrypto) ==========

const DB_NAME = 'clawflag-device';
const DB_STORE = 'keys';

interface DeviceKeys {
  id: string;           // sha256(raw_public_key) hex
  publicKeyB64: string; // base64url of raw 32-byte Ed25519 public key
  privateKey: CryptoKey;
  deviceToken?: string;
}

function bufToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256hex(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadOrCreateDeviceKeys(): Promise<DeviceKeys> {
  const db = await openDB();
  const existing = await new Promise<DeviceKeys | undefined>((resolve) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get('device');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
  if (existing?.privateKey) { db.close(); return existing; }

  // Generate Ed25519 keypair
  const keyPair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  // Export raw public key (32 bytes)
  const pubRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyB64 = bufToBase64Url(pubRaw);
  const id = await sha256hex(pubRaw);

  // Store with non-extractable private key (re-import)
  const keys: DeviceKeys = { id, publicKeyB64, privateKey: keyPair.privateKey };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(keys, 'device');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return keys;
}

async function saveDeviceToken(token: string) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  const store = tx.objectStore(DB_STORE);
  const existing = await new Promise<DeviceKeys | undefined>((resolve) => {
    const req = store.get('device');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
  if (existing) {
    existing.deviceToken = token;
    store.put(existing, 'device');
  }
  await new Promise<void>((r) => { tx.oncomplete = () => r(); });
  db.close();
}

/** Build the payload string that must be signed (matches Gateway's buildDeviceAuthPayload) */
function buildAuthPayload(params: {
  deviceId: string; clientId: string; clientMode: string;
  role: string; scopes: string[]; signedAtMs: number;
  token: string; nonce: string;
}): string {
  return [
    'v2', params.deviceId, params.clientId, params.clientMode,
    params.role, params.scopes.join(','), String(params.signedAtMs),
    params.token, params.nonce
  ].join('|');
}

async function signPayload(privateKey: CryptoKey, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign('Ed25519', privateKey, enc.encode(payload));
  return bufToBase64Url(sig);
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<ReqId, Pending>();
  private eventHandlers = new Set<EventHandler>();
  private closed = false;
  private backoffMs = 800;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private tickIntervalMs = 15000;
  private reqId = 0;
  private opts: GatewayClientOpts;
  private _connected = false;
  private challengeNonce: string | null = null;

  constructor(opts: GatewayClientOpts) {
    this.opts = opts;
  }

  get connected() { return this._connected; }
  get url() { return this.opts.url; }

  start() {
    this.closed = false;
    this.reconnectAttempt = 0;
    this.connect();
  }

  stop() {
    this.closed = true;
    this._connected = false;
    this.clearTimers();
    this.ws?.close(1000, 'client stopped');
    this.ws = null;
    this.flushPending(new Error('client stopped'));
  }

  /** Subscribe to all gateway events. Returns unsubscribe function. */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => { this.eventHandlers.delete(handler); };
  }

  /** Send a request and wait for response */
  async request<T = unknown>(method: string, params: unknown = {}): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('not connected');
    }
    const id = `cf-${++this.reqId}`;
    const timeoutMs = this.opts.requestTimeoutMs ?? 30000;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`request timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
        timer,
      });
      this.ws!.send(JSON.stringify({ type: 'req', id, method, params }));
    });
  }

  // ========== Chat Methods ==========

  async chatHistory(sessionKey: string, limit = 50) {
    return this.request<{ messages?: unknown[] }>('chat.history', { sessionKey, limit });
  }

  async chatSend(sessionKey: string, message: string, opts?: { thinking?: string; idempotencyKey?: string }) {
    const idempotencyKey = opts?.idempotencyKey ?? `cf-send-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return this.request<{ runId: string; status: string }>('chat.send', {
      sessionKey, message, idempotencyKey, thinking: opts?.thinking,
    });
  }

  async chatAbort(sessionKey: string) {
    return this.request<{ ok: boolean }>('chat.abort', { sessionKey });
  }

  async chatInject(sessionKey: string, message: string) {
    return this.request<{ ok: boolean }>('chat.inject', { sessionKey, message });
  }

  // ========== Session Methods ==========

  async sessionsList(opts?: { activeMinutes?: number; limit?: number; includeDerivedTitles?: boolean; includeLastMessage?: boolean }) {
    return this.request<{ sessions: unknown[] }>('sessions.list', opts ?? { activeMinutes: 1440 });
  }

  async sessionsUsage(opts?: { key?: string; startDate?: string; endDate?: string; limit?: number; includeContextWeight?: boolean }) {
    return this.request<unknown>('sessions.usage', opts ?? {});
  }

  async sessionsPatch(key: string, patch: Record<string, unknown>) {
    return this.request<unknown>('sessions.patch', { key, ...patch });
  }

  async sessionsReset(key: string) {
    return this.request<unknown>('sessions.reset', { key, reason: 'new' });
  }

  async sessionsCompact(key: string) {
    return this.request<unknown>('sessions.compact', { key });
  }

  // ========== Cron Methods ==========

  async cronList(includeDisabled = true) {
    return this.request<{ jobs: unknown[] }>('cron.list', { includeDisabled });
  }

  async cronStatus() {
    return this.request<unknown>('cron.status', {});
  }

  async cronAdd(job: Record<string, unknown>) {
    return this.request<unknown>('cron.add', job);
  }

  async cronUpdate(jobId: string, patch: Record<string, unknown>) {
    return this.request<unknown>('cron.update', { jobId, ...patch });
  }

  async cronRemove(jobId: string) {
    return this.request<unknown>('cron.remove', { jobId });
  }

  async cronRun(jobId: string) {
    return this.request<unknown>('cron.run', { jobId });
  }

  async cronRuns(jobId: string) {
    return this.request<{ runs: unknown[] }>('cron.runs', { jobId });
  }

  // ========== Config Methods ==========

  async configGet() {
    const result = await this.request<{ path: string; exists: boolean; raw: string }>('config.get', {});
    // Gateway returns {path, exists, raw} where raw is JSON string
    try {
      const config = result.raw ? JSON.parse(result.raw) : {};
      return { config, path: result.path, exists: result.exists };
    } catch {
      return { config: {} as Record<string, unknown>, path: result.path, exists: result.exists };
    }
  }

  async configSet(config: Record<string, unknown>, baseHash?: string) {
    return this.request<unknown>('config.set', { config, baseHash });
  }

  async configApply(config: Record<string, unknown>, baseHash?: string) {
    return this.request<unknown>('config.apply', { config, baseHash });
  }

  async configSchema() {
    return this.request<unknown>('config.schema', {});
  }

  // ========== System Methods ==========

  async status() {
    return this.request<Record<string, unknown>>('status', {});
  }

  async health() {
    return this.request<Record<string, unknown>>('health', {});
  }

  async modelsList() {
    return this.request<{ models: unknown[] }>('models.list', {});
  }

  async skillsStatus() {
    return this.request<unknown>('skills.status', {});
  }

  async systemPresence() {
    return this.request<unknown>('system-presence', {});
  }

  async nodeList() {
    return this.request<{ nodes: unknown[] }>('node.list', {});
  }

  async logsTail(opts?: { cursor?: number; limit?: number }) {
    return this.request<{ lines: string[]; cursor: number }>('logs.tail', opts ?? {});
  }

  // ========== Internal ==========

  private connect() {
    if (this.closed) return;
    try {
      this.ws = new WebSocket(this.opts.url);
    } catch (e) {
      this.opts.onError?.(`WebSocket create failed: ${e}`);
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener('open', () => {
      // Wait for possible connect.challenge, or send connect after brief delay
      setTimeout(() => {
        if (!this._connected && !this.closed) this.sendConnect();
      }, 600);
    });

    this.ws.addEventListener('message', (ev) => {
      this.handleMessage(String(ev.data ?? ''));
    });

    this.ws.addEventListener('close', (ev) => {
      const wasConnected = this._connected;
      this._connected = false;
      this.ws = null;
      this.clearTimers();
      this.flushPending(new Error(`closed (${ev.code}): ${ev.reason}`));
      if (wasConnected) {
        this.opts.onClose?.(ev.code, ev.reason || 'connection lost');
      }
      this.scheduleReconnect();
    });

    this.ws.addEventListener('error', () => {
      this.opts.onError?.('WebSocket error');
    });
  }

  private scheduleReconnect() {
    if (this.closed) return;
    this.reconnectAttempt++;
    const delay = Math.min(this.backoffMs * Math.pow(1.7, this.reconnectAttempt - 1), 30000);
    this.opts.onReconnecting?.(this.reconnectAttempt, delay);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private clearTimers() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  private async sendConnect() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const auth: Record<string, unknown> = {};
    if (this.opts.token) auth.token = this.opts.token;
    if (this.opts.password) auth.password = this.opts.password;

    const clientId = 'webchat-ui';
    const clientMode = 'webchat';
    const role = 'operator';
    const scopes = ['operator.read', 'operator.write', 'operator.admin', 'operator.approvals'];

    // Device auth: load or create Ed25519 keypair, sign payload
    let device: Record<string, unknown> | undefined;
    try {
      const keys = await loadOrCreateDeviceKeys();
      const nonce = this.challengeNonce || '';
      const signedAt = Date.now();
      const tokenStr = (this.opts.token || '') as string;

      const payload = buildAuthPayload({
        deviceId: keys.id, clientId, clientMode, role, scopes,
        signedAtMs: signedAt, token: tokenStr, nonce,
      });
      const signature = await signPayload(keys.privateKey, payload);

      device = {
        id: keys.id,
        publicKey: keys.publicKeyB64,
        signature,
        signedAt,
        nonce,
      };

      // If we have a saved deviceToken, include it
      if (keys.deviceToken) {
        auth.deviceToken = keys.deviceToken;
      }
    } catch (e) {
      console.warn('Device auth unavailable:', e);
    }

    try {
      const result = await this.request<HelloPayload>('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: clientId,
          version: '0.2.0',
          platform: navigator?.platform || 'web',
          mode: clientMode,
        },
        role,
        scopes,
        auth: Object.keys(auth).length > 0 ? auth : undefined,
        device,
      });

      this._connected = true;
      this.reconnectAttempt = 0;
      this.backoffMs = 800;

      // Save deviceToken if issued
      if (result.auth?.deviceToken) {
        saveDeviceToken(result.auth.deviceToken).catch(() => {});
      }

      // Check if pairing is pending (connected but no scopes)
      if (result.auth?.scopes && result.auth.scopes.length > 0) {
        // Fully authenticated
      } else if (!result.auth?.deviceToken) {
        // No device token = pairing required
        this.opts.onPairingRequired?.();
      }

      // Start tick (heartbeat)
      if (result.policy?.tickIntervalMs) {
        this.tickIntervalMs = result.policy.tickIntervalMs;
      }
      this.tickTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'req', id: `tick-${Date.now()}`, method: 'tick', params: {} }));
        }
      }, this.tickIntervalMs);

      this.opts.onHello?.(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('pairing')) {
        this.opts.onPairingRequired?.();
      }
      this.opts.onError?.(`connect failed: ${msg}`);
    }
  }

  private handleMessage(data: string) {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(data); } catch { return; }

    // Event frame
    if (msg.type === 'event') {
      const event = msg.event as string;

      // Handle connect.challenge
      if (event === 'connect.challenge') {
        const payload = msg.payload as { nonce?: string } | undefined;
        this.challengeNonce = payload?.nonce ?? null;
        this.sendConnect();
        return;
      }

      // Broadcast to all event handlers
      this.eventHandlers.forEach(h => {
        try { h(event, msg.payload); } catch { /* ignore handler errors */ }
      });
      this.opts.onEvent?.(event, msg.payload);
      return;
    }

    // Response frame
    if (msg.type === 'res') {
      const id = msg.id as string;
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      clearTimeout(p.timer);
      if (msg.ok) {
        p.resolve(msg.payload);
      } else {
        const err = msg.error as GatewayError | undefined;
        p.reject(new Error(err?.message ?? 'request failed'));
      }
    }
  }
}
