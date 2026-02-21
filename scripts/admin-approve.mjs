import WebSocket from 'ws';
import crypto from 'crypto';
import fs from 'fs';

const WS_URL = 'ws://127.0.0.1:18789/ws';
const TOKEN = process.env.OPENCLAW_TOKEN || '';

const identity = JSON.parse(fs.readFileSync(process.env.HOME + '/.clawdbot/identity/device.json', 'utf8'));
const privateKey = crypto.createPrivateKey(identity.privateKeyPem);
const pubRaw = crypto.createPublicKey(identity.publicKeyPem).export({type:'spki',format:'der'}).subarray(-32);
const pubB64 = Buffer.from(pubRaw).toString('base64url');

const SCOPES = ['operator.admin', 'operator.approvals', 'operator.pairing'];

function buildPayload(p) {
  return ['v2', p.deviceId, p.clientId, p.clientMode, p.role, p.scopes.join(','), String(p.signedAtMs), p.token, p.nonce].join('|');
}

const ws = new WebSocket(WS_URL);
let reqId = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = `a-${++reqId}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
  });
}

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    const nonce = msg.payload?.nonce || '';
    const signedAt = Date.now();
    const payload = buildPayload({ deviceId: identity.deviceId, clientId: 'cli', clientMode: 'cli', role: 'operator', scopes: SCOPES, signedAtMs: signedAt, token: TOKEN, nonce });
    const signature = crypto.sign(null, Buffer.from(payload, 'utf8'), privateKey).toString('base64url');
    
    send('connect', {
      minProtocol: 3, maxProtocol: 3,
      client: { id: 'cli', version: '1.0.0', platform: 'linux', mode: 'cli' },
      role: 'operator', scopes: SCOPES, auth: { token: TOKEN },
      device: { id: identity.deviceId, publicKey: pubB64, signature, signedAt, nonce },
    }).then(async (hello) => {
      console.log('Connected with admin scopes:', hello.auth?.scopes);
      
      // List and approve pending devices
      try {
        const list = await send('device.pair.list', {});
        console.log('Pending devices:', JSON.stringify(list, null, 2));
        
        for (const req of (list.requests || list.pending || [])) {
          console.log(`Approving ${req.requestId || req.deviceId}...`);
          try {
            await send('device.pair.approve', { requestId: req.requestId });
            console.log('✅ Approved');
          } catch (e) { console.log('❌', e.message); }
        }
      } catch (e) { console.log('pair.list failed:', e.message); }

      // Also update paired device scopes to include operator.read/write
      try {
        const paired = await send('device.pair.list', { status: 'paired' });
        console.log('Paired:', JSON.stringify(paired).slice(0, 200));
      } catch (e) {}
      
      ws.close();
    }).catch(e => { console.log('connect failed:', e.message); ws.close(); });
  } else if (msg.type === 'res') {
    const p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.ok ? p.resolve(msg.payload) : p.reject(new Error(msg.error?.message||'fail')); }
  }
});
ws.on('error', (e) => console.log('error:', e.message));
ws.on('close', () => process.exit(0));
setTimeout(() => process.exit(1), 15000);
