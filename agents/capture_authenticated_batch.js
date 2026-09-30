#!/usr/bin/env node
/*
 Attach to existing Chrome via CDP and capture a small batch of authenticated PNGs.
 Behavior:
 - Reads Agents/captures/manifest.json for planned timestamps and captures the first N entries (default 5).
 - Hides timeline overlays and UI panels where possible.
 - Attempts to set model time via in-page `window.__wgw` API if available.
 - Captures the map canvas when present (crop), otherwise full page.
 - Writes PNGs and per-image metadata into Agents/captures/.

 Usage: node capture_authenticated_batch.js [--count N] [--wait-ms 3000]
 Requires Chrome started with --remote-debugging-port=9222 and logged-in session.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222';
const AGENTS_DIR = __dirname;
const CAP_DIR = path.join(AGENTS_DIR, 'captures');
const MANIFEST = path.join(CAP_DIR, 'manifest.json');
// parse numeric CLI args safely
const idxCount = process.argv.indexOf('--count');
const DEFAULT_COUNT = idxCount >= 0 ? parseInt(process.argv[idxCount+1], 10) : parseInt(process.env.CAPTURE_COUNT || '5', 10);
const idxWait = process.argv.indexOf('--wait-ms');
const RENDER_WAIT_MS = idxWait >= 0 ? parseInt(process.argv[idxWait+1], 10) : parseInt(process.env.RENDER_WAIT_MS || '3000', 10);
const RECORD_ACTIONS = process.argv.includes('--record-actions');
const idxRecord = process.argv.indexOf('--record-seconds');
const RECORD_SECONDS = idxRecord >= 0 ? parseInt(process.argv[idxRecord+1], 10) : parseInt(process.env.RECORD_SECONDS || '20', 10);
const REPLAY_ACTIONS = process.argv.includes('--replay-actions');
const ACTIONS_PATH = path.join(AGENTS_DIR, 'diagnostics', 'user_actions.json');
const PROBE_PATH = path.join(AGENTS_DIR, 'diagnostics', 'probe.json');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

(async () => {
  ensureDir(CAP_DIR);
  if (!fs.existsSync(MANIFEST)) {
    console.error('Manifest not found at', MANIFEST);
    process.exit(2);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  // Support multiple manifest shapes: `planned_captures` | `planned` | `captures` (existing) | array of ISO strings
  let planned = manifest.planned_captures || manifest.planned || [];
  if ((!planned || !planned.length) && Array.isArray(manifest.captures)) {
    // `captures` may contain objects with `ts`, `requested_utc`, or direct png/meta entries
    planned = manifest.captures.map(c => c.ts || c.requested_utc || c.requested || null).filter(Boolean);
  }
  if ((!planned || !planned.length) && Array.isArray(manifest)) {
    planned = manifest.slice(0, DEFAULT_COUNT).map(p => (typeof p === 'string' ? p : (p.ts || p.timestamp)) ).filter(Boolean);
  }
  if (!planned || !planned.length) {
    console.error('No planned captures found in manifest');
    process.exit(2);
  }
  const targets = planned.slice(0, DEFAULT_COUNT).map(p => p.ts || p.timestamp || p);
  // parse lon/lat from manifest url if available for probe-based navigation
  let manifestLon = null, manifestLat = null;
  try {
    if (manifest.url) {
      const u = new URL(manifest.url);
      manifestLon = parseFloat(u.searchParams.get('lon')) || manifestLon;
      manifestLat = parseFloat(u.searchParams.get('lat')) || manifestLat;
    }
  } catch (e) {}

  try {
    const { chromium } = require('playwright');
    console.log('Connecting to Chrome CDP at', CDP_URL);
    const browser = await chromium.connectOverCDP(CDP_URL);
    const contexts = browser.contexts();
    const ctx = contexts.length ? contexts[0] : await browser.newContext();
    const pages = ctx.pages();
    let page = pages.length ? pages[0] : await ctx.newPage();

    // Navigate to the target URL if present in manifest
    if (manifest.url) {
      // retry navigation a few times; some deployments take longer to serve
      const maxNavAttempts = 3;
      let navErr = null;
      for (let attempt=1; attempt<=maxNavAttempts; attempt++) {
        try {
          await page.goto(manifest.url, { waitUntil: 'networkidle', timeout: 120000 });
          navErr = null;
          break;
        } catch (e) {
          navErr = e;
          console.warn(`Navigation warning (attempt ${attempt}):`, e && e.message ? e.message : e);
          await page.waitForTimeout(2000 * attempt);
        }
      }
      if (navErr) console.warn('Final navigation warning:', navErr && navErr.message ? navErr.message : navErr);
    }

    // If probe mode requested, inspect window.__wgw / window.wgw and save keys/signatures
    if (process.argv.includes('--probe')) {
      console.log('Running live probe of window.__wgw / window.wgw');
      const probe = await page.evaluate(() => {
        const w = window.__wgw || window.wgw || {};
        const keys = Object.keys(w || {});
        const sample = {};
        for (const k of keys) {
          try { sample[k] = { type: typeof w[k] }; } catch (e) { sample[k] = { type: 'error' }; }
          if (typeof w[k] === 'function') {
            try { sample[k].src = w[k].toString().slice(0, 2000); } catch (e) { sample[k].src = 'unreadable'; }
          }
        }
        return { keys, sample, detectedAt: new Date().toISOString() };
      });
      ensureDir(path.join(AGENTS_DIR, 'diagnostics'));
      fs.writeFileSync(PROBE_PATH, JSON.stringify(probe, null, 2));
      console.log('Probe result saved to', PROBE_PATH);
      try { await browser.disconnect(); } catch (e) {}
      process.exit(0);
    }

    // If record mode requested, inject listeners and record user clicks for RECORD_SECONDS
    if (RECORD_ACTIONS) {
      console.log('Recording user actions for', RECORD_SECONDS, 'seconds. Please interact with the open browser page now.');
      await page.evaluate(() => {
        window.__recordedActions = window.__recordedActions || [];
        function cssPath(el) {
          if (!el) return null;
          const parts = [];
          while (el && el.nodeType === 1 && el.tagName.toLowerCase() !== 'html') {
            const tag = el.tagName.toLowerCase();
            let nth = 1;
            let sib = el.previousElementSibling;
            while (sib) { if (sib.tagName === el.tagName) nth++; sib = sib.previousElementSibling; }
            parts.unshift(tag + (nth > 1 ? `:nth-of-type(${nth})` : ''));
            el = el.parentElement;
          }
          return parts.join(' > ');
        }
        const handler = (e) => {
          try {
            const sel = cssPath(e.target);
            window.__recordedActions.push({ type: e.type, time: Date.now(), selector: sel, x: e.clientX, y: e.clientY });
          } catch (err) { /* ignore */ }
        };
        window.__recordedHandler = handler;
        window.addEventListener('click', handler, true);
        window.addEventListener('keydown', (e) => { window.__recordedActions.push({ type: 'keydown', key: e.key, time: Date.now() }); }, true);
      });
      // wait and poll
      const waitMs = 1000;
      for (let i=0;i<Math.ceil(RECORD_SECONDS*1000/waitMs);i++) {
        await page.waitForTimeout(waitMs);
        process.stdout.write('.');
      }
      const actions = await page.evaluate(() => window.__recordedActions || []);
      ensureDir(path.join(AGENTS_DIR, 'diagnostics'));
      fs.writeFileSync(ACTIONS_PATH, JSON.stringify(actions, null, 2));
      console.log('\nRecorded', (actions||[]).length, 'actions ->', ACTIONS_PATH);
      // remove listeners
      await page.evaluate(() => { if (window.__recordedHandler) window.removeEventListener('click', window.__recordedHandler, true); });
    }

    for (const ts of targets) {
      console.log('Capturing for timestamp', ts);
      // If replay mode and actions exist, replay them now to drive UI into the expected state
      if (REPLAY_ACTIONS && fs.existsSync(ACTIONS_PATH)) {
        const actionsPayload = JSON.parse(fs.readFileSync(ACTIONS_PATH, 'utf8'));
        console.log('Replaying', actionsPayload.length, 'recorded actions before capture');
        for (const a of actionsPayload) {
          try {
            if (a.type === 'click' && a.selector) {
              // attempt to click the element by selector
              const handle = await page.$(a.selector);
              if (handle) {
                await handle.scrollIntoViewIfNeeded().catch(()=>{});
                const box = await handle.boundingBox();
                if (box) await page.mouse.click(box.x + box.width/2, box.y + box.height/2, { delay: 50 });
                else await page.mouse.click(a.x || 0, a.y || 0, { delay: 50 });
              } else {
                await page.mouse.click(a.x || 0, a.y || 0, { delay: 50 });
              }
            } else if (a.type === 'keydown' || a.type === 'key' || a.type === 'keypress') {
              if (a.key) await page.keyboard.type(a.key);
            }
            await page.waitForTimeout(200);
          } catch (e) { /* swallow per-action errors */ }
        }
        // small pause after replay
        await page.waitForTimeout(500);
      }
      // hide timeline and UI overlays via common selectors
      await page.evaluate(() => {
        const selectors = ['.timeline', '.time-panel', '[data-testid="timeline"]', '.panel.timeline', '.bottom-timeline', '.playback-controls'];
        selectors.forEach(s => {
          const el = document.querySelector(s);
          if (el) el.style.display = 'none';
        });
        // hide floating legends
        const floatSelectors = ['.legend', '.toolbar', '.controls-panel', '.topbar', '.footer-bar'];
        floatSelectors.forEach(s => { const el = document.querySelector(s); if (el) el.style.display = 'none'; });
        return true;
      }).catch(()=>{});

      // attempt multiple programmatic hooks on window.__wgw and common time APIs
      let probeMethods = [];
      try {
        if (fs.existsSync(PROBE_PATH)) {
          const p = JSON.parse(fs.readFileSync(PROBE_PATH, 'utf8'));
          if (Array.isArray(p.keys)) probeMethods = p.keys;
        }
      } catch (e) { probeMethods = []; }

      const apiResult = await page.evaluate(async (iso, probeMethods, lon, lat) => {
        try {
          const out = { tried: [], ok: false };
          const w = window.__wgw || window.wgw || null;
          if (!w) return { ok: false, reason: 'no __wgw or wgw on window' };

          const tryCall = (fnName, ...args) => {
            try {
              const fn = w[fnName];
              if (typeof fn === 'function') { fn.apply(w, args); out.tried.push(fnName); return true; }
            } catch (e) { out.tried.push(fnName + ':error'); }
            return false;
          };

          // Build prioritized setter list: probe methods first, then common names
          const common = ['setTime','set_date','setDateTime','setSimulationTime','setPlaybackTime','jumpTo','jump','goToTime','loadVignette','loadVignetteAt','setState','set_state','at'];
          const setters = Array.from(new Set([...(probeMethods || []), ...common]));
          for (const s of setters) {
            // prefer geographic navigation for 'at'
            if (s === 'at' && typeof lon === 'number' && typeof lat === 'number') {
              if (tryCall(s, lon, lat)) { out.ok = true; out.method = s; return out; }
              continue;
            }
            if (tryCall(s, iso)) { out.ok = true; out.method = s; return out; }
          }

          // try setState with a best-effort object
          if (typeof w.state === 'function' && typeof w.setState === 'function') {
            try {
              const cur = w.state() || {};
              const timeProps = ['time','timestamp','ts','date','datetime'];
              for (const p of timeProps) cur[p] = iso;
              w.setState(cur);
              out.ok = true; out.method = 'setState'; out.tried.push('state->setState');
              return out;
            } catch(e) { out.tried.push('state->setState:error'); }
          }

          // try direct property writes
          const directProps = ['time','timestamp','ts','date','datetime'];
          for (const p of directProps) {
            try { w[p] = iso; out.tried.push('prop:' + p); out.ok = true; out.method = 'prop:' + p; return out; } catch(e) { out.tried.push('prop:' + p + ':error'); }
          }

          return out;
        } catch (err) { return { ok: false, err: String(err) }; }
      }, ts).catch(e => ({ ok: false, err: String(e) }));

      console.log('API result:', apiResult && apiResult.ok ? apiResult : apiResult);

      // wait for rendering and stability: take quick screenshot hashes until stable or max attempts
      const maxStabilityChecks = 8;
      const stabilityHashes = [];
      for (let i=0;i<maxStabilityChecks;i++) {
        await page.waitForTimeout(Math.max(500, RENDER_WAIT_MS));
        // capture small screenshot of canvas if present
        const clipHandle = await page.$('canvas');
        let buf = null;
        if (clipHandle) {
          try {
            const box = await clipHandle.boundingBox();
            if (box && box.width>8 && box.height>8) {
              buf = await page.screenshot({ clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.round(box.width), height: Math.round(box.height) } });
            }
          } catch(e) { buf = null; }
        }
        if (!buf) buf = await page.screenshot({ fullPage: false });
        const hash = require('crypto').createHash('sha256').update(buf).digest('hex');
        stabilityHashes.push(hash);
        const last3 = stabilityHashes.slice(-3);
        if (last3.length===3 && last3.every(h=>h===last3[0])) {
          // stable
          apiResult.stability = { stable: true, hashes: last3 };
          break;
        }
        apiResult.stability = { stable: false, hashes: stabilityHashes.slice(-5) };
      }

      console.log('API result:', apiResult && apiResult.ok ? apiResult : apiResult);

      // final capture (canvas crop if available)
      const canvasHandleFinal = await page.$('canvas');
      let buf = null;
      if (canvasHandleFinal) {
        try {
          const box = await canvasHandleFinal.boundingBox();
          if (box && box.width > 10 && box.height > 10) {
            buf = await page.screenshot({ clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.round(box.width), height: Math.round(box.height) } });
          }
        } catch(e) { buf = null; }
      }
      if (!buf) buf = await page.screenshot({ fullPage: false });

      const fname = `auth_capture_${ts.replace(/[:]/g,'-')}.png`;
      const out = path.join(CAP_DIR, fname);
      fs.writeFileSync(out, buf);
      const metadata = { ts, url: page.url(), file: out, checksum: sha256(buf), apiResult };
      fs.writeFileSync(out + '.json', JSON.stringify(metadata, null, 2));
      console.log('Saved', out);
    }

    try { await browser.disconnect(); } catch (e) {}
    console.log('Batch capture complete.');
    process.exit(0);
  } catch (err) {
    console.error('Batch capture failed:', err && err.message ? err.message : err);
    process.exit(4);
  }
})();
