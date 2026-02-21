import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { RelayMessage } from './types';
import { CryptoManager } from './crypto';

export class RelayClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private destroyed = false;

  constructor(
    private relayUrl: string,
    private token: string,
    private crypto: CryptoManager,
  ) {
    super();
  }

  connect(): void {
    if (this.destroyed) return;

    const url = `${this.relayUrl}/ws?token=${this.token}&role=agent`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.reconnectDelay = 1000;
      this.startHeartbeat();
      this.emit('connected');
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data.toString());
    });

    this.ws.on('close', (code, reason) => {
      this.stopHeartbeat();
      this.emit('disconnected', { code, reason: reason.toString() });
      this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      this.emit('error', err);
    });
  }

  private handleMessage(raw: string): void {
    let msg: RelayMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'pair-ack':
        this.emit('pair-ack', msg.payload);
        break;

      case 'pair-complete':
        this.emit('pair-complete');
        // Send our public key for key exchange (both sides connected now)
        this.send({
          type: 'key-exchange',
          payload: { publicKey: this.crypto.publicKeyBase64 },
        });
        break;

      case 'key-exchange':
        // Received peer's public key
        if (msg.payload?.publicKey) {
          this.crypto.deriveSharedKey(msg.payload.publicKey);
          this.emit('key-exchanged');
        }
        break;

      case 'relay':
        // Decrypt and emit
        if (this.crypto.hasSharedKey && msg.payload) {
          try {
            const plaintext = this.crypto.decrypt(msg.payload);
            const command = JSON.parse(plaintext);
            this.emit('command', command);
          } catch (err) {
            this.emit('error', new Error(`Decrypt failed: ${err}`));
          }
        } else {
          // Pre-encryption relay (during pairing)
          this.emit('relay', msg.payload);
        }
        break;

      case 'disconnect':
        this.emit('peer-disconnected', msg.payload);
        break;

      case 'pong':
        // Heartbeat response
        break;
    }
  }

  // Send encrypted relay message
  sendEncrypted(data: any): void {
    if (!this.crypto.hasSharedKey) {
      throw new Error('Cannot send encrypted message — key exchange not complete');
    }
    const plaintext = JSON.stringify(data);
    const encrypted = this.crypto.encrypt(plaintext);
    this.send({ type: 'relay', payload: encrypted });
  }

  // Send raw relay message
  send(msg: RelayMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 10_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  destroy(): void {
    this.destroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}
