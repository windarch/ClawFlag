import WebSocket from 'ws';
import { ConnectionRole, PairedConnection, RelayMessage } from './types';

const MAX_CONNECTIONS = 100;
const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 30_000;

export class RelayManager {
  private connections = new Map<string, PairedConnection>();
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    this.heartbeatInterval = setInterval(() => this.checkHeartbeats(), HEARTBEAT_INTERVAL_MS);
  }

  get connectionCount(): number {
    return this.connections.size;
  }

  canAccept(): boolean {
    return this.connections.size < MAX_CONNECTIONS;
  }

  register(tokenId: string, role: ConnectionRole, ws: WebSocket): boolean {
    let conn = this.connections.get(tokenId);
    if (!conn) {
      conn = { tokenId, app: null, agent: null, lastActivity: Date.now() };
      this.connections.set(tokenId, conn);
    }

    if (conn[role] !== null) {
      // Already connected for this role
      return false;
    }

    conn[role] = ws;
    conn.lastActivity = Date.now();

    // Check if both sides are connected
    if (conn.app && conn.agent) {
      const pairComplete: RelayMessage = { type: 'pair-complete', timestamp: Date.now() };
      const msg = JSON.stringify(pairComplete);
      this.safeSend(conn.app, msg);
      this.safeSend(conn.agent, msg);
      this.log(`Pair complete: ${tokenId}`);
    }

    return true;
  }

  isPaired(tokenId: string): boolean {
    const conn = this.connections.get(tokenId);
    return !!(conn?.app && conn?.agent);
  }

  getStatus(tokenId: string): { paired: boolean; appConnected: boolean; agentConnected: boolean } {
    const conn = this.connections.get(tokenId);
    return {
      paired: !!(conn?.app && conn?.agent),
      appConnected: !!conn?.app,
      agentConnected: !!conn?.agent,
    };
  }

  handleMessage(tokenId: string, from: ConnectionRole, raw: string): void {
    const conn = this.connections.get(tokenId);
    if (!conn) return;

    conn.lastActivity = Date.now();

    let msg: RelayMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // Handle ping/pong locally
    if (msg.type === 'ping') {
      const target = conn[from];
      if (target) this.safeSend(target, JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      return;
    }

    // Forward relay and key-exchange messages to the other party
    if (msg.type === 'relay' || msg.type === 'key-exchange') {
      const target = from === 'app' ? conn.agent : conn.app;
      if (target) {
        this.safeSend(target, raw);
      }
    }
  }

  handleDisconnect(tokenId: string, role: ConnectionRole): void {
    const conn = this.connections.get(tokenId);
    if (!conn) return;

    const other = role === 'app' ? conn.agent : conn.app;
    conn[role] = null;

    if (other) {
      this.safeSend(other, JSON.stringify({
        type: 'disconnect',
        payload: { role },
        timestamp: Date.now(),
      }));
    }

    // If both disconnected, clean up
    if (!conn.app && !conn.agent) {
      this.connections.delete(tokenId);
      this.log(`Connection cleaned up: ${tokenId}`);
    }
  }

  private checkHeartbeats(): void {
    const now = Date.now();
    for (const [id, conn] of this.connections) {
      if (now - conn.lastActivity > HEARTBEAT_TIMEOUT_MS) {
        if (conn.app) conn.app.close(1001, 'heartbeat timeout');
        if (conn.agent) conn.agent.close(1001, 'heartbeat timeout');
        this.connections.delete(id);
        this.log(`Heartbeat timeout: ${id}`);
      }
    }
  }

  private safeSend(ws: WebSocket, data: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }

  private log(msg: string): void {
    console.log(`[relay ${new Date().toISOString()}] ${msg}`);
  }

  closeAll(): void {
    for (const [, conn] of this.connections) {
      if (conn.app) conn.app.close(1001, 'server shutdown');
      if (conn.agent) conn.agent.close(1001, 'server shutdown');
    }
    this.connections.clear();
    clearInterval(this.heartbeatInterval);
  }
}
