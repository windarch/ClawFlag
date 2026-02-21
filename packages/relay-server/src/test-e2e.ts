import WebSocket from 'ws';
import http from 'http';

const BASE = process.env.RELAY_URL || 'http://localhost:8099';
const WS_BASE = BASE.replace('http', 'ws');

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

function httpPost(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

function httpGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function connectWs(token: string, role: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}/ws?token=${token}&role=${role}`);
    ws.on('open', () => {
      setupBuffer(ws);
      resolve(ws);
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('ws connect timeout')), 5000);
  });
}

// Buffer messages per websocket so we don't miss early arrivals
const messageBuffers = new WeakMap<WebSocket, any[]>();

function setupBuffer(ws: WebSocket) {
  const buf: any[] = [];
  messageBuffers.set(ws, buf);
  ws.on('message', (data: WebSocket.Data) => {
    buf.push(JSON.parse(data.toString()));
  });
}

function waitForMessage(ws: WebSocket, type: string, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const buf = messageBuffers.get(ws) || [];
    // Check buffer first
    const idx = buf.findIndex(m => m.type === type);
    if (idx >= 0) {
      const msg = buf.splice(idx, 1)[0];
      return resolve(msg);
    }
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs);
    const check = setInterval(() => {
      const i = buf.findIndex(m => m.type === type);
      if (i >= 0) {
        clearTimeout(timer);
        clearInterval(check);
        resolve(buf.splice(i, 1)[0]);
      }
    }, 50);
  });
}

async function run() {
  console.log('\n🧪 ClawFlag Relay Server E2E Tests\n');

  // 1. Health check
  console.log('1. Health check');
  const health = await httpGet(`${BASE}/health`);
  assert('Health returns ok', health.status === 'ok');

  // 2. Create token
  console.log('2. Create token');
  const tokenRes = await httpPost(`${BASE}/api/tokens`);
  assert('Token created', tokenRes.token?.startsWith('cf_tok_'));
  assert('Has expiresAt', typeof tokenRes.expiresAt === 'number');
  const token = tokenRes.token;

  // 3. Token status
  console.log('3. Token status (before pairing)');
  const status1 = await httpGet(`${BASE}/api/tokens/${token}/status`);
  assert('Not paired yet', status1.paired === false);

  // 4. Connect app
  console.log('4. Connect app');
  const appWs = await connectWs(token, 'app');
  const appAck = await waitForMessage(appWs, 'pair-ack');
  assert('App receives pair-ack', appAck.type === 'pair-ack');
  assert('App role confirmed', appAck.payload?.role === 'app');

  // 5. Connect agent → triggers pair-complete
  console.log('5. Connect agent');
  const agentWs = await connectWs(token, 'agent');
  const agentAck = await waitForMessage(agentWs, 'pair-ack');
  assert('Agent receives pair-ack', agentAck.type === 'pair-ack');

  // Wait for pair-complete on both sides
  const appPairComplete = await waitForMessage(appWs, 'pair-complete');
  const agentPairComplete = await waitForMessage(agentWs, 'pair-complete');
  assert('App receives pair-complete', appPairComplete.type === 'pair-complete');
  assert('Agent receives pair-complete', agentPairComplete.type === 'pair-complete');

  // 6. Token status after pairing
  console.log('6. Token status (after pairing)');
  const status2 = await httpGet(`${BASE}/api/tokens/${token}/status`);
  assert('Paired', status2.paired === true);
  assert('App connected', status2.appConnected === true);
  assert('Agent connected', status2.agentConnected === true);

  // 7. App → Agent relay
  console.log('7. App sends relay → Agent receives');
  const testPayload = { encrypted: 'hello-from-app', nonce: '123' };
  appWs.send(JSON.stringify({ type: 'relay', payload: testPayload }));
  const agentReceived = await waitForMessage(agentWs, 'relay');
  assert('Agent received relay', JSON.stringify(agentReceived.payload) === JSON.stringify(testPayload));

  // 8. Agent → App relay
  console.log('8. Agent sends relay → App receives');
  const testPayload2 = { encrypted: 'hello-from-agent', nonce: '456' };
  agentWs.send(JSON.stringify({ type: 'relay', payload: testPayload2 }));
  const appReceived = await waitForMessage(appWs, 'relay');
  assert('App received relay', JSON.stringify(appReceived.payload) === JSON.stringify(testPayload2));

  // 9. Key exchange forwarding
  console.log('9. Key exchange forwarding');
  const keyMsg = { type: 'key-exchange', payload: { publicKey: 'fake-key-abc' } };
  appWs.send(JSON.stringify(keyMsg));
  const agentKey = await waitForMessage(agentWs, 'key-exchange');
  assert('Key exchange forwarded', agentKey.payload?.publicKey === 'fake-key-abc');

  // 10. Disconnect notification
  console.log('10. Agent disconnect → App notified');
  agentWs.close();
  const disconnectMsg = await waitForMessage(appWs, 'disconnect');
  assert('App notified of agent disconnect', disconnectMsg.payload?.role === 'agent');

  // Cleanup
  appWs.close();

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
