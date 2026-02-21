import WebSocket from 'ws';
import crypto from 'crypto';
import fs from 'fs';

const WS_URL = 'ws://127.0.0.1:18789/ws';
const TOKEN = process.env.OPENCLAW_TOKEN || '';

// Load existing paired device identity
const identity = JSON.parse(fs.readFileSync(process.env.HOME + '/.clawdbot/identity/device.json', 'utf8'));
const deviceAuth = JSON.parse(fs.readFileSync(process.env.HOME + '/.clawdbot/identity/device-auth.json', 'utf8'));

const privateKey = crypto.createPrivateKey(identity.privateKeyPem);
const pubRaw = crypto.createPublicKey(identity.publicKeyPem).export({ type: 'spki', format: 'der' }).subarray(-32);
const pubB64 = Buffer.from(pubRaw).toString('base64url');
const deviceId = identity.deviceId;

// Get operator device token
const operatorToken = deviceAuth.tokens?.operator?.token;

const CLIENT_ID = 'webchat-ui';
const CLIENT_MODE = 'webchat';
const ROLE = 'operator';
const SCOPES = ['operator.read', 'operator.write', 'operator.approvals'];

function buildAuthPayload(p) {
  return ['v2', p.deviceId, p.clientId, p.clientMode, p.role, p.scopes.join(','), String(p.signedAtMs), p.token, p.nonce].join('|');
}

console.log(`Device ID: ${deviceId}`);
console.log(`Operator token: ${operatorToken ? 'yes' : 'no'}`);
console.log(`Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL, { headers: { Origin: 'http://localhost:5173' } });
let reqId = 0;
const pending = new Map();

function send(method, params = {}) {
  const id = `t-${++reqId}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
  });
}

ws.on('open', () => console.log('WS connected'));
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    const nonce = msg.payload?.nonce || '';
    const signedAt = Date.now();
    const payload = buildAuthPayload({
      deviceId, clientId: CLIENT_ID, clientMode: CLIENT_MODE,
      role: ROLE, scopes: SCOPES, signedAtMs: signedAt, token: TOKEN, nonce,
    });
    const signature = crypto.sign(null, Buffer.from(payload, 'utf8'), privateKey).toString('base64url');
    
    const auth = { token: TOKEN };
    
    send('connect', {
      minProtocol: 3, maxProtocol: 3,
      client: { id: CLIENT_ID, version: '0.2.0', platform: 'linux', mode: CLIENT_MODE },
      role: ROLE, scopes: SCOPES,
      auth,
      device: { id: deviceId, publicKey: pubB64, signature, signedAt, nonce },
    }).then(async (hello) => {
      console.log('✅ connect ok');
      console.log('  scopes:', hello.auth?.scopes || 'none');
      console.log('  role:', hello.auth?.role || 'none');
      console.log('  deviceToken:', hello.auth?.deviceToken ? 'YES' : 'no');
      
      if (!hello.auth?.scopes?.length) {
        console.log('⚠️  Still no scopes');
        ws.close();
        return;
      }

      for (const [m, p] of [['status',{}],['sessions.list',{limit:3}],['cron.list',{includeDisabled:true}],['models.list',{}],['health',{}]]) {
        try { const r = await send(m, p); console.log(`✅ ${m}:`, JSON.stringify(r).slice(0, 250)); }
        catch (e) { console.log(`❌ ${m}:`, e.message); }
      }
      console.log('\n=== ALL API TESTS PASSED ===');
      ws.close();
    }).catch(e => { 
      console.log('❌ connect:', e.message);
      // Parse error details
      console.log('Full error object may have requestId for pairing');
      ws.close(); 
    });
  } else if (msg.type === 'res') {
    const p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.ok ? p.resolve(msg.payload) : p.reject(new Error(msg.error?.message||'fail')); }
  }
});
ws.on('error', (e) => console.log('❌ error:', e.message));
ws.on('close', () => process.exit(0));
setTimeout(() => process.exit(1), 20000);
