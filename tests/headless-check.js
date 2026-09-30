const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'http://127.0.0.1:8000';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

    const hasVideo = await page.$('video') !== null;
    const hasPlayButton = await page.$('#playPause') !== null;
    const hasVignetteList = await page.$('#vignetteList') !== null;
    if (!hasVideo || !hasPlayButton || !hasVignetteList) {
      throw new Error('The video player controls are missing');
    }

    await page.locator('#launcher').click();
    if (!await page.locator('body').evaluate(el => el.classList.contains('drawer-open'))) {
      throw new Error('The vignette drawer did not open');
    }
    if (await page.locator('.vignette-card').count() !== 8) {
      throw new Error('Expected all eight vignette cards');
    }

    await page.keyboard.press('Escape');
    if (await page.locator('body').evaluate(el => el.classList.contains('drawer-open'))) {
      throw new Error('Escape did not close the vignette drawer');
    }

    await page.locator('#launcher').click();
    await page.locator('[data-id="model"]').click();
    await page.waitForFunction(() => {
      const video = document.querySelector('#video');
      const status = document.querySelector('#status').textContent;
      return video.style.display === 'block' || status.includes('Unable to play this video');
    }, null, { timeout: 30000 });

    const media = await page.locator('#video').evaluate(video => ({
      source: video.currentSrc,
      readyState: video.readyState,
      duration: video.duration,
      error: video.error && video.error.message,
      visible: video.style.display === 'block',
    }));
    if (!media.visible || !media.source.endsWith('/videos/Opening_Placeholder.mov') ||
        media.readyState < 1 || !Number.isFinite(media.duration)) {
      throw new Error('Placeholder video did not load in the player: ' + JSON.stringify(media));
    }

    await page.locator('#mute').click();
    if (!await page.locator('#video').evaluate(video => video.muted)) {
      throw new Error('Mute control did not mute the clip');
    }

    await page.locator('#launcher').click();
    if (!await page.locator('#video').evaluate(video => video.paused)) {
      throw new Error('Opening the drawer did not pause playback');
    }

    console.log('UI and placeholder video check passed', JSON.stringify({
      vignetteCards: 8,
      videoDuration: media.duration,
      videoReadyState: media.readyState,
    }));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('UI check failed:', err && err.stack ? err.stack : err);
    await browser.close();
    process.exit(2);
  }
})();
