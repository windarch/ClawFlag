/**
 * ClawFlag E2E API Test
 * Tests all Gateway WS API methods that ClawFlag uses
 */
const WebSocket = require('ws');

const GW = 'ws://REDACTED_SERVER_IP:18789';
const ORIGIN = 'http://REDACTED_SERVER_IP:8088';
const TOKEN = 'REDACTED_GATEWAY_TOKEN';

let ws, reqId = 0;
const pending = {};
const results = { pass: 0, fail: 0, tests: [] };

function req(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = `t${++reqId}`;
    pending[id] = { resolve, reject, method };
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
    setTimeout(() => {
      if (pending[id]) {
        delete pending[id];
        reject(new Error('timeout'));
      }
    }, 15000);
  });
}

function test(name, fn) {
  return fn().then(r => {
    results.pass++;
    results.tests.push({ name, status: '✅', detail: typeof r === 'string' ? r : '' });
    console.log(`✅ ${name}${r ? ': ' + r : ''}`);
  }).catch(e => {
    results.fail++;
    results.tests.push({ name, status: '❌', detail: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  });
}

async function run() {
  ws = new WebSocket(GW, { headers: { origin: ORIGIN } });

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
    setTimeout(() => reject(new Error('ws open timeout')), 5000);
  });

  // Handle messages
  ws.on('message', d => {
    const msg = JSON.parse(d.toString());
    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      // handled below
    }
    if (msg.type === 'res' && pending[msg.id]) {
      const p = pending[msg.id];
      delete pending[msg.id];
      if (msg.ok === false) p.reject(new Error(msg.error?.message || 'unknown'));
      else p.resolve(msg.payload);
    }
  });

  // Wait for challenge
  await new Promise(r => setTimeout(r, 500));

  // 1. Connect
  await test('connect (v3 protocol)', async () => {
    const res = await req('connect', {
      minProtocol: 3, maxProtocol: 3,
      client: { id: 'webchat-ui', version: '0.2.0', platform: 'node-test', mode: 'webchat' },
      role: 'operator',
      scopes: ['operator.read', 'operator.write', 'operator.admin', 'operator.approvals'],
      auth: { token: TOKEN },
    });
    if (res.type !== 'hello-ok') throw new Error('not hello-ok');
    const scopes = res.auth?.scopes || [];
    return `protocol=${res.protocol}, scopes=${scopes.length}, methods=${res.features?.methods?.length}`;
  });

  // 2. Health
  await test('health', async () => {
    const res = await req('health');
    return `status=${res.status || 'ok'}`;
  });

  // 3. Status
  await test('status', async () => {
    const res = await req('status');
    return `version=${res.version}, agents=${res.agents?.length || 0}`;
  });

  // 4. Sessions list
  let sessionKey;
  await test('sessions.list', async () => {
    const res = await req('sessions.list');
    const sessions = res.sessions || [];
    if (sessions.length > 0) sessionKey = sessions[0].key;
    return `count=${sessions.length}, first=${sessionKey || 'none'}`;
  });

  // 5. Chat history
  if (sessionKey) {
    await test('chat.history', async () => {
      const res = await req('chat.history', { sessionKey, limit: 3 });
      const msgs = res.messages || [];
      msgs.forEach((m, i) => {
        const contentType = typeof m.content;
        const isArray = Array.isArray(m.content);
        const text = isArray
          ? m.content.filter(b => b.type === 'text').map(b => b.text).join('').slice(0, 50)
          : String(m.content).slice(0, 50);
        console.log(`   msg[${i}]: role=${m.role}, contentType=${contentType}, isArray=${isArray}, text="${text}..."`);
      });
      return `messages=${msgs.length}, content_is_array=${Array.isArray(msgs[0]?.content)}`;
    });
  }

  // 6. Models list
  await test('models.list', async () => {
    const res = await req('models.list');
    const models = res.models || res.providers || [];
    return `count=${Array.isArray(models) ? models.length : Object.keys(models).length}`;
  });

  // 7. Cron list
  await test('cron.list', async () => {
    const res = await req('cron.list');
    const jobs = res.jobs || [];
    return `jobs=${jobs.length}`;
  });

  // 8. Usage
  await test('usage.status', async () => {
    const res = await req('usage.status');
    return `ok`;
  });

  // 9. Sessions preview
  if (sessionKey) {
    await test('sessions.preview', async () => {
      const res = await req('sessions.preview', { sessionKey });
      return `key=${res.sessionKey || sessionKey}`;
    });
  }

  // 10. Config get
  await test('config.get', async () => {
    const res = await req('config.get', { path: 'gateway' });
    return `bind=${res.value?.bind || res.bind || 'unknown'}`;
  });

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${results.pass} passed, ${results.fail} failed out of ${results.pass + results.fail} tests`);

  ws.close();
  process.exit(results.fail > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
