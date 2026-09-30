#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const OUTDIR = path.join(__dirname, 'captures');
const DIAGDIR = path.join(__dirname, 'diagnostics');
const MANIFEST = path.join(OUTDIR, 'manifest.json');
function ensure(d){ if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive:true }); }
function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }
function isoSafe(iso){ return iso.replace(/[:]/g,'-').replace(/\./g,'-'); }

const timestamps = [
  '2000-07-13T23:00:00.000Z',
  '2000-07-13T23:30:00.000Z',
  '2000-07-14T00:00:00.000Z',
  '2000-07-14T00:30:00.000Z',
  '2000-07-14T01:00:00.000Z'
];

ensure(OUTDIR); ensure(DIAGDIR);

async function run(){
  const cdp = 'http://127.0.0.1:9222';
  console.log('Connecting to CDP', cdp);
  const browser = await chromium.connectOverCDP(cdp);
  const contexts = browser.contexts();
  let page = null;
  for(const ctx of contexts){
    for(const p of ctx.pages()){
      const u = p.url();
      if(u && u.includes('nav.nextspace-uat-us-nj.net')){ page = p; break; }
    }
    if(page) break;
  }
  if(!page){
    const ctx = contexts.length ? contexts[0] : await browser.newContext();
    page = await ctx.newPage();
    console.log('No existing demo tab found; navigating to default URL');
    await page.goto(process.env.CAPTURE_URL || 'about:blank', { waitUntil:'networkidle', timeout:60000 }).catch(()=>{});
  }

  // global collectors
  const captures = [];

  for(const ts of timestamps){
    const entry = { requested_utc: ts, status: 'ok', diagnostics: [] };
    try{
      // collect console/network notes for this capture
      const consoleMsgs = [];
      const netSamples = [];
      const onConsole = (msg) => { try{ consoleMsgs.push({type:msg.type(), text: msg.text(), location: msg.location()}); }catch(e){} };
      const onResponse = (res) => { try{ netSamples.push({url: res.url(), status: res.status(), statusText: res.statusText()}); if(netSamples.length>50) netSamples.shift(); }catch(e){} };
      page.on('console', onConsole);
      page.on('response', onResponse);

      // attempt to set scenario by text
      let scenarioConfirmed = false;
      try{
        const locator = page.getByText('100-Year + SLR', { exact: false });
        if(await locator.count() > 0){
          await locator.first().click({ timeout: 3000 }).catch(()=>{});
          await page.waitForTimeout(800);
          // attempt to confirm via aria-pressed/checked or class
          const el = await locator.first();
          const confirmed = await el.evaluate((n)=>{
            if(n.getAttribute('aria-pressed')==='true' || n.getAttribute('aria-checked')==='true') return true;
            const cls = (n.className||'').toLowerCase();
            if(cls.includes('active')||cls.includes('selected')||cls.includes('is-active')) return true;
            return false;
          }).catch(()=>false);
          scenarioConfirmed = !!confirmed;
        }
      }catch(e){ /* ignore */ }
      entry.scenario = scenarioConfirmed ? 'confirmed' : 'unconfirmed';

      // attempt to set time control if present (best-effort)
      let timeSet = false;
      try{
        // find inputs that look like datetime or time selectors
        const dtlocs = await page.$$('input[type="datetime-local"], input[aria-label*="time" i], input[placeholder*="time" i]');
        if(dtlocs && dtlocs.length){
          for(const el of dtlocs){
            await el.fill(ts.replace('Z','')); // best-effort
          }
          timeSet = true;
        } else {
          // try buttons or menu entries that contain the UTC date/time string's date
          // fallback: try a generic time control label
          const tbtn = page.getByText('Time', { exact: false });
          if(await tbtn.count() > 0){ await tbtn.first().click().catch(()=>{}); timeSet = true; }
        }
      }catch(e){}
      entry.time_set = timeSet ? 'attempted' : 'not-found';

      // wait for UI to settle
      await page.waitForTimeout(1200);

      // stability check and capture
      async function captureOnce(){
        const canvas = await page.$('canvas');
        if(canvas){
          const box = await canvas.boundingBox();
          if(box && box.width>0 && box.height>0){
            return await page.screenshot({ clip: { x: Math.max(0, Math.round(box.x)), y: Math.max(0, Math.round(box.y)), width: Math.round(box.width), height: Math.round(box.height) } });
          }
        }
        return await page.screenshot({ fullPage: true });
      }

      const frames = [];
      for(let i=0;i<3;i++){ frames.push(await captureOnce()); await page.waitForTimeout(500); }
      const stable = frames.every((b)=> sha256(b) === sha256(frames[0]));
      entry.stability = { stable, hashes: frames.map((b)=>sha256(b)) };

      const buf = frames[0];
      // parse camera params from URL
      const url = page.url();
      entry.url = url;
      const params = {};
      try{
        const u = new URL(url);
        for(const [k,v] of u.searchParams.entries()){ params[k]=v; }
      }catch(e){}
      const lon = params.lon || params.longitude || 'unk';
      const lat = params.lat || params.latitude || 'unk';
      const alt = params.alt || 'unk';
      const pitch = params.pitch || 'unk';
      const heading = params.heading || 'unk';

      const nameBase = `${isoSafe(ts)}_lon${lon}_lat${lat}_alt${alt}_pitch${pitch}_heading${heading}`;
      const pngPath = path.join(OUTDIR, `${nameBase}.png`);
      fs.writeFileSync(pngPath, buf);
      const checksum = sha256(buf);

      // write metadata
      const meta = {
        utc_timestamp: ts,
        url,
        viewport: { width: page.viewportSize ? page.viewportSize.width : null, height: page.viewportSize ? page.viewportSize.height : null },
        checksum,
        scenario_status: entry.scenario,
        time_set: entry.time_set,
        stability: entry.stability,
        console_notes_count: consoleMsgs.length,
        network_notes_count: netSamples.length,
        diagnostics: []
      };
      const metaPath = pngPath + '.json';
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

      // if unconfirmed scenario or unstable, save diagnostics
      if(entry.scenario === 'unconfirmed' || !entry.stability.stable){
        const diagPrefix = path.join(DIAGDIR, `${isoSafe(ts)}`);
        const diagPng = diagPrefix + '.png';
        fs.writeFileSync(diagPng, buf);
        const consolePath = diagPrefix + '.console.txt';
        fs.writeFileSync(consolePath, consoleMsgs.map(m=>`${m.type}: ${m.text}`).join('\n'));
        const netPath = diagPrefix + '.network.json';
        fs.writeFileSync(netPath, JSON.stringify(netSamples.slice(-50), null, 2));
        meta.diagnostics.push({ screenshot: diagPng, console: consolePath, network: netPath });
      }

      // store capture entry for manifest
      captures.push({ png: pngPath, meta: metaPath, requested_utc: ts, checksum, scenario_status: meta.scenario_status || entry.scenario, stability: meta.stability });

      // cleanup listeners
      page.off('console', onConsole);
      page.off('response', onResponse);

      console.log('Captured', pngPath);

    }catch(err){
      entry.status = 'error';
      entry.error = String(err && err.message ? err.message : err);
      const diagf = path.join(DIAGDIR, `error_${isoSafe(ts)}.json`);
      fs.writeFileSync(diagf, JSON.stringify({ error: entry.error, timestamp: new Date().toISOString() }, null, 2));
      entry.diagnostics.push(diagf);
      captures.push({ requested_utc: ts, error: entry.error, diagnostics: entry.diagnostics });
      console.error('Capture failed for', ts, err && err.message ? err.message : err);
    }
  }

  // update manifest
  let manifest = { captures: [], updated: new Date().toISOString() };
  if(fs.existsSync(MANIFEST)){
    try{ manifest = JSON.parse(fs.readFileSync(MANIFEST,'utf8')); }catch(e){}
  }
  manifest.captures = manifest.captures.concat(captures);
  manifest.updated = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  try{ await browser.disconnect(); }catch(e){}
  console.log('Done. Manifest updated at', MANIFEST);
}

run().catch((e)=>{ console.error('Fatal error', e); process.exit(2); });
