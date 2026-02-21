const WebSocket = require('ws');
const GW = 'ws://REDACTED_SERVER_IP:18789';
const TOKEN = 'REDACTED_GATEWAY_TOKEN';
const ORIGIN = 'http://REDACTED_SERVER_IP:8088';

let reqId = 0;
const pending = {};

const ws = new WebSocket(GW, { headers: { origin: ORIGIN } });

function req(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = `t${++reqId}`;
    pending[id] = { resolve, reject };
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
    setTimeout(() => reject(new Error('timeout: ' + method)), 8000);
  });
}

ws.on('message', d => {
  const msg = JSON.parse(d.toString());
  if (msg.type === 'res' && pending[msg.id]) {
    const p = pending[msg.id];
    delete pending[msg.id];
    if (msg.ok === false) p.reject(Object.assign(new Error(msg.error?.message || 'fail'), { full: msg }));
    else p.resolve(msg.payload);
  }
});

ws.on('open', async () => {
  try {
    await new Promise(r => setTimeout(r, 500));

    // Connect v3
    const c = await req('connect', {
      minProtocol: 3, maxProtocol: 3,
      client: { id: 'webchat-ui', version: '0.2.0', platform: 'node-test', mode: 'webchat' },
      role: 'operator',
      scopes: ['operator.read', 'operator.write', 'operator.admin'],
      auth: { token: TOKEN },
    });
    console.log('connected, protocol:', c.protocol);

    // Get a session key
    const sl = await req('sessions.list');
    const sk = sl.sessions?.[0]?.sessionKey;
    console.log('sessionKey:', sk);

    // --- sessions.preview tests ---
    if (sk) {
      try {
        console.log('\n--- sessions.preview {keys: [sk]} ---');
        const p1 = await req('sessions.preview', { keys: [sk] });
        console.log('OK:', JSON.stringify(p1).slice(0, 300));
      } catch(e) { console.log('FAIL:', e.message, JSON.stringify(e.full?.error)); }

      try {
        console.log('\n--- sessions.preview {sessionKey: sk} ---');
        const p2 = await req('sessions.preview', { sessionKey: sk });
        console.log('OK:', JSON.stringify(p2).slice(0, 300));
      } catch(e) { console.log('FAIL:', e.message, JSON.stringify(e.full?.error)); }
    }

    // --- config.get tests ---
    try {
      console.log('\n--- config.get {} ---');
      const c1 = await req('config.get', {});
      console.log('OK:', JSON.stringify(c1).slice(0, 300));
    } catch(e) { console.log('FAIL:', e.message, JSON.stringify(e.full?.error)); }

    try {
      console.log('\n--- config.get {keys: ["gateway"]} ---');
      const c2 = await req('config.get', { keys: ['gateway'] });
      console.log('OK:', JSON.stringify(c2).slice(0, 300));
    } catch(e) { console.log('FAIL:', e.message, JSON.stringify(e.full?.error)); }

    try {
      console.log('\n--- config.get {path: "gateway"} ---');
      const c3 = await req('config.get', { path: 'gateway' });
      console.log('OK:', JSON.stringify(c3).slice(0, 300));
    } catch(e) { console.log('FAIL:', e.message, JSON.stringify(e.full?.error)); }

    try {
      console.log('\n--- config.get {key: "gateway"} ---');
      const c4 = await req('config.get', { key: 'gateway' });
      console.log('OK:', JSON.stringify(c4).slice(0, 300));
    } catch(e) { console.log('FAIL:', e.message, JSON.stringify(e.full?.error)); }

    ws.close();
  } catch (e) {
    console.error('Fatal:', e.message);
    ws.close();
  }
});
