/**
 * E2E Browser Test for ClawFlag
 * Uses Playwright to test real browser connection to Gateway
 */
import { chromium } from 'playwright';

const DEV_URL = 'http://localhost:5173';
const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_PORT = '18789';
const TOKEN = process.env.OPENCLAW_TOKEN || '';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Device') || msg.text().includes('connect')) {
      console.log(`  [browser ${msg.type()}]`, msg.text());
    }
  });

  // 1. Navigate to app
  console.log('\n=== Test 1: Load App ===');
  await page.goto(DEV_URL);
  await page.waitForTimeout(1000);
  const title = await page.title();
  console.log(`Title: ${title}`);
  
  // Should redirect to /connect since not connected
  const url = page.url();
  console.log(`URL: ${url}`);
  console.log(url.includes('connect') ? '✅ Redirected to connect page' : '⚠️ Not on connect page');
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/clawflag-01-connect.png', fullPage: true });
  console.log('📸 Screenshot: /tmp/clawflag-01-connect.png');
  
  // 2. Fill in connection form
  console.log('\n=== Test 2: Fill Connection Form ===');
  const hostInput = page.locator('input[placeholder*="192.168"]');
  const portInput = page.locator('input[type="number"]');
  const tokenInput = page.locator('input[type="password"]');
  
  if (await hostInput.count() > 0) {
    await hostInput.fill(GATEWAY_HOST);
    await portInput.fill(GATEWAY_PORT);
    if (TOKEN) await tokenInput.fill(TOKEN);
    console.log('✅ Form filled');
    
    await page.screenshot({ path: '/tmp/clawflag-02-filled.png', fullPage: true });
    console.log('📸 Screenshot: /tmp/clawflag-02-filled.png');
    
    // 3. Click connect
    console.log('\n=== Test 3: Connect ===');
    const connectBtn = page.locator('button:has-text("连接")');
    if (await connectBtn.count() > 0) {
      await connectBtn.click();
      console.log('Clicked connect, waiting 5s...');
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: '/tmp/clawflag-03-connecting.png', fullPage: true });
      console.log('📸 Screenshot: /tmp/clawflag-03-connecting.png');
      
      // Check result
      const pageContent = await page.textContent('body');
      if (pageContent.includes('已连接') || pageContent.includes('设备待批准') || page.url().includes('/chat') || page.url() === DEV_URL + '/') {
        console.log('✅ Connection attempt made');
        
        if (pageContent.includes('设备待批准') || pageContent.includes('pairing')) {
          console.log('⚠️ Device needs approval (expected for new browser device)');
        } else if (pageContent.includes('已连接')) {
          console.log('✅ Connected successfully!');
          
          // Navigate to other pages
          for (const [path, name] of [['/chat', 'Chat'], ['/pulse', 'Pulse'], ['/brain', 'Brain'], ['/router', 'Router']]) {
            await page.goto(DEV_URL + path);
            await page.waitForTimeout(2000);
            await page.screenshot({ path: `/tmp/clawflag-page-${name.toLowerCase()}.png`, fullPage: true });
            console.log(`📸 ${name}: /tmp/clawflag-page-${name.toLowerCase()}.png`);
          }
        }
      } else if (pageContent.includes('error') || pageContent.includes('错误')) {
        console.log('❌ Connection error');
        console.log('Page text:', pageContent.slice(0, 500));
      }
    }
  } else {
    console.log('❌ Could not find connection form');
    const bodyText = await page.textContent('body');
    console.log('Page content:', bodyText?.slice(0, 300));
  }
  
  // Final screenshot
  await page.screenshot({ path: '/tmp/clawflag-final.png', fullPage: true });
  console.log('\n📸 Final: /tmp/clawflag-final.png');
  
  await browser.close();
  console.log('\n=== E2E Test Complete ===');
}

run().catch(e => { console.error('Test failed:', e.message); process.exit(1); });
