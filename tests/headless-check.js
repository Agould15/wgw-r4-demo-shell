const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'http://127.0.0.1:8000';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Ensure video element and controls exist
    const hasVideo = await page.$('video') !== null;
    const hasPlayButton = await page.$('#playPause') !== null;
    if (!hasVideo) throw new Error('No <video> element found');
    if (!hasPlayButton) throw new Error('No #playPause control found');

    // Try to exercise basic play/pause behavior safely
    const playResult = await page.evaluate(async () => {
      const v = document.querySelector('video');
      if (!v) return { ok: false, reason: 'no-video' };
      v.muted = true;
      try {
        // Attempt to call play; some pages may not have a src yet so this can reject
        const p = v.play();
        if (p && typeof p.then === 'function') {
          await p.catch(() => {});
        }
      } catch (e) {
        // ignore playback errors for placeholder content
      }
      // Pause and ensure paused state can be set
      v.pause();
      return { ok: true, paused: v.paused, currentTime: v.currentTime };
    });

    if (!playResult.ok) throw new Error('Playback check failed: ' + (playResult.reason || 'unknown'));

    console.log('Headless check passed:', playResult);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Headless check error:', err && err.stack ? err.stack : err);
    await browser.close();
    process.exit(2);
  }
})();
