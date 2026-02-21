// Connect as the main agent session (already authenticated) and approve pending devices
import WebSocket from 'ws';

const WS_URL = 'ws://127.0.0.1:18789/ws';
const TOKEN = process.env.OPENCLAW_TOKEN || '';

const ws = new WebSocket(WS_URL, { headers: { Origin: 'http://localhost:5173' } });
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
    send('connect', {
      minProtocol: 3, maxProtocol: 3,
      client: { id: 'cli', version: '1.0.0', platform: 'linux', mode: 'cli' },
      role: 'operator',
      scopes: ['operator.read', 'operator.write', 'operator.admin'],
      auth: TOKEN ? { token: TOKEN } : undefined,
    }).then(async (hello) => {
      console.log('Connected, scopes:', hello.auth?.scopes || 'none');
      
      // List pending devices
      try {
        const devices = await send('devices.list', {});
        console.log('Devices:', JSON.stringify(devices, null, 2));
        
        // Approve any pending
        const pending = (devices.devices || devices.pending || []).filter(d => d.status === 'pending');
        for (const d of pending) {
          console.log(`Approving device: ${d.id || d.deviceId}...`);
          try {
            await send('devices.approve', { deviceId: d.id || d.deviceId });
            console.log('✅ Approved!');
          } catch (e) { console.log('❌ Approve failed:', e.message); }
        }
        if (!pending.length) console.log('No pending devices found');
      } catch (e) {
        console.log('devices.list failed:', e.message);
        // Try alternative methods
        try {
          const r = await send('system-presence', {});
          console.log('system-presence:', JSON.stringify(r).slice(0, 300));
        } catch (e2) { console.log('system-presence failed:', e2.message); }
      }
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
