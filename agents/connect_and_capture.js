#!/usr/bin/env node
/* Attach to an existing Chrome (CDP) and capture an authenticated screenshot of the WGW demo.
   Usage: start Chrome with --remote-debugging-port=9222 (optionally reuse profile),
   then run: node connect_and_capture.js
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DEFAULT_OUTDIR = path.join(__dirname, 'captures');
const URL = process.env.CAPTURE_URL || 'https://anchorqea1.nav.nextspace-uat-us-nj.net/?viewId=d3a2b714&bookmarkId=AGQOSVHY3B2GJPAEG6UU7PTWIM&lon=-72.81378&lat=41.15603&alt=7984.976&pitch=-34.29&heading=338.43';

function ensureDirSync(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

(async () => {
  ensureDirSync(DEFAULT_OUTDIR);
  try {
    const { chromium } = require('playwright');
    // Connect to local Chrome launched with --remote-debugging-port=9222
    const wsEndpoint = 'http://127.0.0.1:9222';
    console.log('Connecting to Chrome CDP at', wsEndpoint);
    const browser = await chromium.connectOverCDP(wsEndpoint);
    // find a page with matching URL, else open a new tab in the first context
    const contexts = browser.contexts();
    let page = null;
    for (const ctx of contexts) {
      const pages = ctx.pages();
      for (const p of pages) {
        const u = p.url();
        if (u && u.includes('nav.nextspace-uat-us-nj.net')) { page = p; break; }
      }
      if (page) break;
    }
    if (!page) {
      // use any existing context or create a new one
      const ctx = contexts.length ? contexts[0] : await browser.newContext();
      page = await ctx.newPage();
      console.log('Navigating to demo URL in attached Chrome...');
      await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    } else {
      console.log('Found existing tab:', page.url());
      // navigate to requested URL to ensure exact view if desired
      await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
    }

    // wait some seconds for dynamic UI to settle
    await page.waitForTimeout(4000);

    // try to locate canvas and screenshot canvas crop if possible
    const canvasHandle = await page.$('canvas');
    let buf = null;
    if (canvasHandle) {
      const box = await canvasHandle.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        buf = await page.screenshot({ clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.round(box.width), height: Math.round(box.height) } });
      }
    }
    if (!buf) buf = await page.screenshot({ fullPage: true });

    const filename = `cdp_capture_${new Date().toISOString().replace(/[:]/g,'-')}.png`;
    const outPath = path.join(DEFAULT_OUTDIR, filename);
    fs.writeFileSync(outPath, buf);
    const md = {
      ts_utc: new Date().toISOString(), url: page.url(), file: outPath, checksum: sha256(buf)
    };
    fs.writeFileSync(outPath + '.json', JSON.stringify(md, null, 2));
    console.log('Saved capture:', outPath);

    // Do not close the remote browser (don't call browser.close()) to avoid shutting user's Chrome.
    // Disconnect Playwright's connection
    try { await browser.disconnect(); } catch (e) { /* ignore */ }
    process.exit(0);
  } catch (err) {
    console.error('Failed to attach to Chrome via CDP. Ensure Chrome is started with:\n' +
      '  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug\n' +
      'or start Chrome with remote debugging on your profile. Error:\n', err.message || err);
    process.exit(2);
  }
})();
