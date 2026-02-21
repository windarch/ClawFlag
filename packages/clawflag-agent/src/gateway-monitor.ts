import WebSocket from 'ws';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// Simplified Gateway monitor — connects to OpenClaw Gateway WS
// and monitors status, sessions, costs

export class GatewayMonitor extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private destroyed = false;
  private pendingRequests = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();

  constructor(
    private gatewayUrl: string,
    private gatewayToken?: string,
  ) {
    super();
  }

  get isConnected(): boolean {
    return this.connected;
  }

  connect(): void {
    if (this.destroyed) return;

    this.ws = new WebSocket(this.gatewayUrl);

    this.ws.on('open', () => {
      this.connected = true;
      this.handshake();
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data.toString());
    });

    this.ws.on('close', () => {
      this.connected = false;
      this.emit('disconnected');
      this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      this.emit('error', err);
    });
  }

  private handshake(): void {
    // Send connect frame (simplified — real impl would do full v3 handshake)
    this.sendFrame('connect', {
      clientId: 'clawflag-agent',
      protocol: 3,
      ...(this.gatewayToken ? { token: this.gatewayToken } : {}),
    });
  }

  private handleMessage(raw: string): void {
    let frame: any;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }

    // Handle connect response
    if (frame.method === 'connect' && frame.type === 'res') {
      if (frame.payload?.ok || frame.payload?.hello) {
        this.emit('connected');
      } else if (frame.payload?.challenge) {
        // Handle challenge-response auth if needed
        this.emit('challenge', frame.payload);
      }
    }

    // Handle request responses
    if (frame.id && this.pendingRequests.has(frame.id)) {
      const pending = this.pendingRequests.get(frame.id)!;
      clearTimeout(pending.timer);
      this.pendingRequests.delete(frame.id);
      if (frame.error) {
        pending.reject(new Error(frame.error.message || 'gateway error'));
      } else {
        pending.resolve(frame.payload);
      }
    }

    // Handle events
    if (frame.type === 'event') {
      this.emit('gateway-event', frame);
    }
  }

  // Send a request to gateway and wait for response
  async request(method: string, params?: any, timeoutMs = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Gateway request timeout: ${method}`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.sendFrame(method, params, id);
    });
  }

  async getStatus(): Promise<any> {
    return this.request('status');
  }

  async getSessions(): Promise<any> {
    return this.request('sessions.list');
  }

  async emergencyStop(): Promise<void> {
    // Kill all active sessions
    try {
      const sessions = await this.getSessions();
      if (sessions?.sessions) {
        for (const s of sessions.sessions) {
          try {
            await this.request('sessions.abort', { sessionKey: s.key });
          } catch {
            // Best effort
          }
        }
      }
    } catch {
      // If we can't list sessions, try a broader approach
    }
    this.emit('emergency-stop');
  }

  private sendFrame(method: string, payload?: any, id?: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const frame: any = { type: 'req', method };
    if (id) frame.id = id;
    if (payload) frame.payload = payload;
    this.ws.send(JSON.stringify(frame));
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    this.reconnectTimer = setTimeout(() => this.connect(), 5000);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('destroyed'));
    }
    this.pendingRequests.clear();
    if (this.ws) this.ws.close();
  }
}
