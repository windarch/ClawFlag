import WebSocket from 'ws';
const WS_URL = 'ws://127.0.0.1:18789/ws';
const TOKEN = process.env.OPENCLAW_TOKEN || '';
console.log(`Connecting to ${WS_URL}...`);
const ws = new WebSocket(WS_URL, { headers: { Origin: 'http://localhost:5173' } });
let reqId = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = `t-${++reqId}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
  });
}
ws.on('open', () => console.log('WS connected'));
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    send('connect', {
      minProtocol: 3, maxProtocol: 3,
      client: { id: 'webchat', version: '0.2.0', platform: 'linux', mode: 'webchat' },
      role: 'operator', scopes: ['operator.read', 'operator.write', 'operator.admin'],
      auth: TOKEN ? { token: TOKEN } : undefined,
    }).then(async (hello) => {
      console.log('✅ connect scopes:', hello.scopes || hello.session?.scopes, 'role:', hello.role || hello.session?.role);
      console.log('full hello:', JSON.stringify(hello).slice(0, 500));
      for (const [m, p] of [['status',{}],['sessions.list',{limit:3}],['cron.list',{includeDisabled:true}],['models.list',{}],['health',{}],['skills.status',{}]]) {
        try { const r = await send(m, p); console.log(`✅ ${m}:`, JSON.stringify(r).slice(0, 200)); }
        catch (e) { console.log(`❌ ${m}:`, e.message); }
      }
      ws.close(); 
    }).catch(e => { console.log('❌ connect:', e.message); ws.close(); });
  } else if (msg.type === 'res') {
    const p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.ok ? p.resolve(msg.payload) : p.reject(new Error(msg.error?.message||'fail')); }
  }
});
ws.on('error', (e) => console.log('❌ error:', e.message));
ws.on('close', () => process.exit(0));
setTimeout(() => process.exit(1), 30000);
