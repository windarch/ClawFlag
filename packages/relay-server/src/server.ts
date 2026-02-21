import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { TokenManager } from './token';
import { RelayManager } from './relay';
import { ConnectionRole, RelayMessage } from './types';

export function createServer(port: number = 8099) {
  const app = express();
  const tokenManager = new TokenManager();
  const relayManager = new RelayManager();

  app.use(express.json());

  // CORS
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      connections: relayManager.connectionCount,
      tokens: tokenManager.count,
      uptime: process.uptime(),
    });
  });

  // Create token
  app.post('/api/tokens', (_req, res) => {
    if (!relayManager.canAccept()) {
      res.status(503).json({ error: 'max connections reached' });
      return;
    }
    const token = tokenManager.generate();
    res.json({
      token: token.token,
      expiresAt: token.expiresAt,
    });
  });

  // Token status
  app.get('/api/tokens/:token/status', (req, res) => {
    const token = tokenManager.get(req.params.token);
    if (!token) {
      res.status(404).json({ error: 'token not found or expired' });
      return;
    }
    const status = relayManager.getStatus(token.id);
    res.json({
      ...status,
      paired: token.paired || status.paired,
      expiresAt: token.expiresAt,
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const tokenStr = url.searchParams.get('token');
    const role = url.searchParams.get('role') as ConnectionRole | null;

    if (!tokenStr || !role || !['app', 'agent'].includes(role)) {
      ws.close(4000, 'missing token or role param');
      return;
    }

    const token = tokenManager.validate(tokenStr);
    if (!token) {
      ws.close(4001, 'invalid or expired token');
      return;
    }

    if (!relayManager.canAccept()) {
      ws.close(4002, 'max connections reached');
      return;
    }

    const registered = relayManager.register(token.id, role, ws);
    if (!registered) {
      ws.close(4003, `${role} already connected for this token`);
      return;
    }

    // Check if pair is complete
    if (relayManager.isPaired(token.id)) {
      tokenManager.markPaired(tokenStr);
    }

    // Send ack
    const ack: RelayMessage = {
      type: 'pair-ack',
      payload: { role, tokenId: token.id },
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(ack));

    log(`${role} connected: ${token.id}`);

    ws.on('message', (data) => {
      relayManager.handleMessage(token.id, role, data.toString());
    });

    ws.on('close', () => {
      relayManager.handleDisconnect(token.id, role);
      log(`${role} disconnected: ${token.id}`);
    });

    ws.on('error', (err) => {
      log(`${role} error: ${err.message}`);
    });
  });

  function log(msg: string) {
    console.log(`[server ${new Date().toISOString()}] ${msg}`);
  }

  function start(): Promise<void> {
    return new Promise((resolve) => {
      server.listen(port, () => {
        console.log(`\n🚩 ClawFlag Relay Server v0.1.0`);
        console.log(`   HTTP:  http://localhost:${port}`);
        console.log(`   WS:    ws://localhost:${port}/ws`);
        console.log(`   Health: http://localhost:${port}/health\n`);
        resolve();
      });
    });
  }

  function stop(): Promise<void> {
    return new Promise((resolve) => {
      relayManager.closeAll();
      tokenManager.destroy();
      server.close(() => resolve());
    });
  }

  return { app, server, start, stop, tokenManager, relayManager };
}
