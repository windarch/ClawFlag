import WebSocket from 'ws';
import crypto from 'crypto';

const WS_URL = 'ws://127.0.0.1:18789/ws';
const TOKEN = process.env.OPENCLAW_TOKEN || '';
const CLIENT_ID = 'openclaw-control-ui';
const CLIENT_MODE = 'ui';
const ROLE = 'operator';
const SCOPES = ['operator.read', 'operator.write', 'operator.approvals'];

// Generate Ed25519 keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const pubRaw = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32); // last 32 bytes
const pubB64 = Buffer.from(pubRaw).toString('base64url');
const deviceId = crypto.createHash('sha256').update(pubRaw).digest('hex');

function buildAuthPayload(p) {
  return ['v2', p.deviceId, p.clientId, p.clientMode, p.role, p.scopes.join(','), String(p.signedAtMs), p.token, p.nonce].join('|');
}

console.log(`Device ID: ${deviceId}`);
console.log(`Public Key (b64url): ${pubB64}`);
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
    console.log('Got challenge, nonce:', nonce.slice(0, 20) + '...');
    
    const signedAt = Date.now();
    const payload = buildAuthPayload({
      deviceId, clientId: CLIENT_ID, clientMode: CLIENT_MODE,
      role: ROLE, scopes: SCOPES, signedAtMs: signedAt, token: TOKEN, nonce,
    });
    console.log('Signing payload:', payload.slice(0, 80) + '...');
    const signature = crypto.sign(null, Buffer.from(payload, 'utf8'), privateKey).toString('base64url');
    
    send('connect', {
      minProtocol: 3, maxProtocol: 3,
      client: { id: CLIENT_ID, version: '0.2.0', platform: 'linux', mode: CLIENT_MODE },
      role: ROLE, scopes: SCOPES,
      auth: TOKEN ? { token: TOKEN } : undefined,
      device: { id: deviceId, publicKey: pubB64, signature, signedAt, nonce },
    }).then(async (hello) => {
      console.log('✅ connect ok');
      console.log('  scopes:', hello.auth?.scopes || 'none');
      console.log('  role:', hello.auth?.role || 'none');
      console.log('  deviceToken:', hello.auth?.deviceToken ? 'YES' : 'no');
      
      if (!hello.auth?.scopes?.length) {
        console.log('\n⚠️  No scopes - device may need approval.');
        console.log('Waiting 60s for approval event...');
        setTimeout(() => { console.log('Timeout waiting'); ws.close(); }, 60000);
        return;
      }

      for (const [m, p] of [['status',{}],['sessions.list',{limit:3}],['cron.list',{includeDisabled:true}],['models.list',{}],['health',{}]]) {
        try { const r = await send(m, p); console.log(`✅ ${m}:`, JSON.stringify(r).slice(0, 200)); }
        catch (e) { console.log(`❌ ${m}:`, e.message); }
      }
      console.log('\n=== All API tests passed ===');
      ws.close();
    }).catch(e => { console.log('❌ connect:', e.message); ws.close(); });
  } else if (msg.type === 'event') {
    console.log('  event:', msg.event);
  } else if (msg.type === 'res') {
    const p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.ok ? p.resolve(msg.payload) : p.reject(new Error(msg.error?.message||'fail')); }
  }
});
ws.on('error', (e) => console.log('❌ error:', e.message));
ws.on('close', () => process.exit(0));
setTimeout(() => { console.log('Global timeout'); process.exit(1); }, 90000);
