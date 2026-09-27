const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'http://127.0.0.1:8000';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // DOM-only checks (no playback)
    const hasVideo = await page.$('video') !== null;
    const hasPlayButton = await page.$('#playPause') !== null;
    const hasVignetteList = await page.$('#vignetteList') !== null;
    if (!hasVideo) throw new Error('No <video> element found');
    if (!hasPlayButton) throw new Error('No #playPause control found');
    if (!hasVignetteList) throw new Error('No #vignetteList found');

    console.log('DOM-only Playwright check passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('DOM-only Playwright check error:', err && err.stack ? err.stack : err);
    await browser.close();
    process.exit(2);
  }
})();
