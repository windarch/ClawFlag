import { chromium } from 'playwright-core';

const DEV_URL = 'http://172.25.153.214:5173';
const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_PORT = '18789';
const TOKEN = process.env.OPENCLAW_TOKEN || '';
const CHROME = process.env.HOME + '/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome';

async function run() {
  console.log('Launching Chrome...');
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 14 size
  
  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('Device') || t.includes('connect') || t.includes('error') || t.includes('WebSocket') || t.includes('scope')) {
      console.log(`  [${msg.type()}] ${t.slice(0, 200)}`);
    }
  });
  page.on('pageerror', err => console.log(`  [PAGE ERROR] ${err.message.slice(0, 200)}`));

  // Test 1: Load app
  console.log('\n=== 1. Load App ===');
  await page.goto(DEV_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log(`URL: ${page.url()}`);
  await page.screenshot({ path: '/tmp/cf-01-initial.png', fullPage: true });
  console.log('📸 /tmp/cf-01-initial.png');

  // Test 2: Check if on connect page
  console.log('\n=== 2. Connect Page ===');
  const bodyText = await page.textContent('body');
  const onConnect = bodyText.includes('ClawFlag') || bodyText.includes('连接') || bodyText.includes('Gateway');
  console.log(onConnect ? '✅ Connect page loaded' : '❌ Unexpected page');

  // Test 3: Fill form and connect
  console.log('\n=== 3. Fill & Connect ===');
  try {
    const hostInput = page.locator('input[type="text"]').first();
    await hostInput.fill(GATEWAY_HOST);
    
    const portInput = page.locator('input[type="number"]').first();
    await portInput.fill(GATEWAY_PORT);
    
    if (TOKEN) {
      const tokenInput = page.locator('input[type="password"]').first();
      await tokenInput.fill(TOKEN);
    }
    console.log('✅ Form filled');
    await page.screenshot({ path: '/tmp/cf-02-filled.png', fullPage: true });
    
    // Click connect
    const btn = page.locator('button', { hasText: '连接' }).first();
    await btn.click();
    console.log('Clicked connect...');
    
    // Wait for result
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/tmp/cf-03-result.png', fullPage: true });
    console.log('📸 /tmp/cf-03-result.png');
    
    const resultText = await page.textContent('body');
    const currentUrl = page.url();
    console.log(`URL after connect: ${currentUrl}`);
    
    if (currentUrl.includes('/chat') || currentUrl === DEV_URL + '/') {
      console.log('✅ Redirected to app - CONNECTION SUCCESSFUL!');
      
      // Visit all pages
      for (const [path, name] of [['/pulse', 'Pulse'], ['/brain', 'Brain'], ['/router', 'Router'], ['/chat', 'Chat']]) {
        await page.goto(DEV_URL + path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `/tmp/cf-page-${name.toLowerCase()}.png`, fullPage: true });
        const text = await page.textContent('body');
        console.log(`📸 ${name}: /tmp/cf-page-${name.toLowerCase()}.png (${text.length} chars)`);
      }
    } else if (resultText.includes('设备待批准') || resultText.includes('pairing')) {
      console.log('⚠️ Device needs approval (expected for new browser keypair)');
    } else if (resultText.includes('无权限') || resultText.includes('no scopes')) {
      console.log('⚠️ Connected but no scopes');
    } else if (resultText.includes('重连') || resultText.includes('error') || resultText.includes('断开')) {
      console.log('❌ Connection error');
      console.log('Text:', resultText.slice(0, 300));
    } else {
      console.log('? Unknown state');
      console.log('Text:', resultText.slice(0, 300));
    }
  } catch (e) {
    console.log('❌ Form interaction failed:', e.message);
    await page.screenshot({ path: '/tmp/cf-error.png', fullPage: true });
  }

  // Final
  await page.screenshot({ path: '/tmp/cf-final.png', fullPage: true });
  console.log('\n📸 Final: /tmp/cf-final.png');
  await browser.close();
  console.log('\n=== E2E Complete ===');
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
