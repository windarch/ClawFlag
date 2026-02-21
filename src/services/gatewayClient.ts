/**
 * Gateway WebSocket Client
 * Implements the OpenClaw Gateway WS protocol (JSON-RPC style)
 */

type ReqId = string;
type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

export interface GatewayClientOpts {
  url: string;
  token?: string;
  onHello?: (payload: Record<string, unknown>) => void;
  onEvent?: (event: string, payload: unknown) => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: string) => void;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<ReqId, Pending>();
  private closed = false;
  private backoffMs = 800;
  public connectNonce: string | null = null;
  private reqId = 0;
  private opts: GatewayClientOpts;

  constructor(opts: GatewayClientOpts) {
    this.opts = opts;
  }

  start() {
    this.closed = false;
    this.connect();
  }

  stop() {
    this.closed = true;
    this.ws?.close();
    this.ws = null;
    this.flushPending(new Error('client stopped'));
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async request<T = unknown>(method: string, params: unknown = {}): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('not connected');
    }
    const id = `cf-${++this.reqId}`;
    const msg = { type: 'req', id, method, params };
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
      });
      this.ws!.send(JSON.stringify(msg));
    });
  }

  private connect() {
    if (this.closed) return;
    this.ws = new WebSocket(this.opts.url);

    this.ws.addEventListener('open', () => {
      // Wait for connect.challenge or send connect directly
      setTimeout(() => this.sendConnect(), 500);
    });

    this.ws.addEventListener('message', (ev) => {
      this.handleMessage(String(ev.data ?? ''));
    });

    this.ws.addEventListener('close', (ev) => {
      this.ws = null;
      this.flushPending(new Error(`closed (${ev.code}): ${ev.reason}`));
      this.opts.onClose?.(ev.code, ev.reason || 'no reason');
      this.scheduleReconnect();
    });

    this.ws.addEventListener('error', () => {
      this.opts.onError?.('WebSocket error');
    });
  }

  private scheduleReconnect() {
    if (this.closed) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 1.7, 15000);
    setTimeout(() => this.connect(), delay);
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) p.reject(err);
    this.pending.clear();
  }

  private async sendConnect() {
    const auth = this.opts.token ? { token: this.opts.token } : undefined;
    try {
      const result = await this.request<Record<string, unknown>>('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'clawflag',
          version: '0.2.0',
          platform: navigator.platform || 'web',
          mode: 'webchat',
        },
        role: 'operator.admin',
        scopes: ['operator.admin'],
        auth,
      });
      this.backoffMs = 800;
      this.opts.onHello?.(result);
    } catch {
      // connect failed, will reconnect
    }
  }

  private handleMessage(data: string) {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === 'event') {
      const event = msg.event as string;
      if (event === 'connect.challenge') {
        const payload = msg.payload as { nonce?: string } | undefined;
        if (payload?.nonce) {
          this.connectNonce = payload.nonce;
          this.sendConnect();
        }
        return;
      }
      this.opts.onEvent?.(event, msg.payload);
      return;
    }

    if (msg.type === 'res') {
      const id = msg.id as string;
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      if (msg.ok) {
        p.resolve(msg.payload);
      } else {
        const err = msg.error as { message?: string } | undefined;
        p.reject(new Error(err?.message ?? 'request failed'));
      }
    }
  }
}
