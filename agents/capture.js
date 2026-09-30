#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// CLI parsing (minimist optional)
let argv = {};
try { argv = require('minimist')(process.argv.slice(2)); } catch (e) {
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--+/, '');
      const next = raw[i+1];
      if (!next || next.startsWith('--')) { argv[key] = true; } else { argv[key] = next; i++; }
    }
  }
}

const DEFAULT_OUTDIR = path.join(__dirname, 'captures');
const DEFAULT_DIAG = path.join(__dirname, 'diagnostics');
const DEFAULT_VERIF = path.join(__dirname, 'verification');

const DRY_RUN = argv['dry-run'] || process.env.DRY_RUN === '1' || false;
const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || argv.interval || '30', 10);
const START_RAW = process.env.CAPTURE_START_ISO || argv.start || '2000-07-13T19:00:00'; // local ET by default (no TZ)
const END_RAW = process.env.CAPTURE_END_ISO || argv.end || '2000-07-15T08:00:00';
const URL = process.env.CAPTURE_URL || argv.url || 'https://anchorqea1.nav.nextspace-uat-us-nj.net/?viewId=d3a2b714&bookmarkId=AGQOSVHY3B2GJPAEG6UU7PTWIM&lon=-72.81564&lat=41.1636&alt=7456.931&pitch=-34.29&heading=338.43';
const OUTDIR = process.env.OUTDIR || argv.outdir || DEFAULT_OUTDIR;
const RENDER_WAIT_MS = parseInt(process.env.RENDER_WAIT_MS || argv['render-wait-ms'] || '3000', 10);
const HEADLESS = (argv.headless === undefined) ? (process.env.HEADLESS !== 'false') : (argv.headless === 'true' || argv.headless === true);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || argv['max-retries'] || '5', 10);
const STABILITY_THRESHOLD_PCT = parseFloat(process.env.STABILITY_THRESHOLD_PCT || argv['stability-threshold-pct'] || '0.001'); // 0.1% default -> 0.001

function ensureDirSync(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

// Interpret ISO-like strings: if timezone missing, assume Eastern Time (EDT/EST). For simplicity,
// when no timezone is provided we assume -04:00 (EDT) which is valid for the July 2000 default window.
function toUTCISOString(s) {
  if (!s) return null;
  // if contains Z or + or - (timezone), parse directly
  if (/[zZ]|[+\-][0-9]{2}(:?[0-9]{2})?$/.test(s)) return new Date(s).toISOString();
  // otherwise assume Eastern Daylight (UTC-4). Use explicit offset -04:00
  const withOffset = s + '-04:00';
  return new Date(withOffset).toISOString();
}

function enumerateTimestamps(startIsoRaw, endIsoRaw, intervalMinutes) {
  const startIso = toUTCISOString(startIsoRaw);
  const endIso = toUTCISOString(endIsoRaw);
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start) || isNaN(end) || end < start) return [];
  const out = [];
  let cur = new Date(start);
  while (cur <= end) {
    out.push(new Date(cur));
    cur = new Date(cur.getTime() + intervalMinutes * 60000);
  }
  return out;
}

// R4 extraction helpers: search candidate files across workspace roots
const WORKSPACE_CANDIDATES = [
  path.resolve(__dirname, '..'), // parent workspace
  path.resolve(__dirname, '..', '..'), // grandparent
  process.cwd(),
  // common project folder in this environment
  path.resolve('/Users/anthonygould/Documents/GitHub/anchor-qea-digital-twin-pilot-repo')
];

function findFileRelativeCandidates(relPath) {
  for (const root of WORKSPACE_CANDIDATES) {
    const p = path.join(root, relPath);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function readIfExists(p) { try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; } catch (e) { return null; } }

function extractR4Fields() {
  ensureDirSync(DEFAULT_VERIF);
  const candidatePaths = [
    'docs_inventory_review.md',
    'current_state.md',
    path.join('docs','12_milestone_1','01_Milestone_1_Executive_Summary.md'),
    path.join('docs','04_data','netcdf_hydro_model_import_visualization.md'),
    path.join('docs','03_architecture','target_architecture.md'),
    path.join('project_brief.md'),
  ];
  const results = {};
  const sources = {};
  const notFound = [];
  for (const rel of candidatePaths) {
    const f = findFileRelativeCandidates(rel);
    if (!f) { notFound.push(rel); continue; }
    const txt = readIfExists(f);
    if (!txt) continue;
    // simple regex search for candidate values
    const candidates = {};
    const scenMatch = txt.match(/100[- ]?Year\b(?:\s*\+\s*SLR)?/i);
    if (scenMatch) { candidates.scenario = scenMatch[0].trim(); }
    const cadence = txt.match(/(\d+)\s*(minute|hr|hour|seconds?)\b/i);
    if (cadence) { candidates.time_step = cadence[0]; }
    const netcdf = txt.match(/NetCDF|\.nc\b|netcdf/gi);
    if (netcdf) { candidates.netcdf = netcdf.length ? 'present' : null; }
    const aoi = txt.match(/AOI|area of interest|Long Island Sound|Connecticut/gi);
    if (aoi) { candidates.aoi = aoi[0]; }
    const datum = txt.match(/vertical datum|datum|NAVD88|NGVD29|NAVD 88/gi);
    if (datum) { candidates.vertical_datum = datum[0]; }
    const provenance = txt.match(/provenance|model provenance|source (?:model|dataset)|AQ|Anchor QEA/gi);
    if (provenance) { candidates.provenance = provenance[0]; }

    // merge into results and record source
    for (const k of Object.keys(candidates)) {
      if (!results[k]) results[k] = new Set();
      if (candidates[k]) results[k].add(candidates[k]);
      if (!sources[k]) sources[k] = [];
      sources[k].push({ file: f, snippet: candidates[k] || null });
    }
  }

  // convert sets to arrays
  const final = {};
  for (const k of Object.keys(results)) final[k] = Array.from(results[k]);

  const r4 = { extracted: final, sources };
  const conflicts = {};
  for (const k of Object.keys(final)) {
    if (final[k].length > 1) conflicts[k] = final[k];
  }

  // If a human resolution file exists in verification/conflicts.json with a "resolved": true flag,
  // apply the resolution mapping to override extracted candidates and avoid blocking captures.
  const conflictFilePath = path.join(DEFAULT_VERIF, 'conflicts.json');
  if (fs.existsSync(conflictFilePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(conflictFilePath, 'utf8'));
      if (raw && raw.resolved && raw.resolution) {
        for (const [k, v] of Object.entries(raw.resolution)) {
          final[k] = [v];
          // ensure sources keep existing context
          if (!sources[k]) sources[k] = [];
        }
        // recompute r4 and clear conflicts
        r4.extracted = final;
        for (const key of Object.keys(conflicts)) delete conflicts[key];
      }
    } catch (e) {
      // ignore parse errors and fall back to normal conflict behavior
    }
  }

  fs.writeFileSync(path.join(DEFAULT_VERIF, 'r4_vignette_source.json'), JSON.stringify(r4, null, 2));
  if (Object.keys(conflicts).length > 0) {
    fs.writeFileSync(path.join(DEFAULT_VERIF, 'conflicts.json'), JSON.stringify(conflicts, null, 2));
    fs.writeFileSync(path.join(DEFAULT_VERIF, 'report.md'), `# Verification report\n\nStatus: conflict\n\nConflicts written to conflicts.json\n`);
    return { r4, conflicts: conflicts };
  }

  fs.writeFileSync(path.join(DEFAULT_VERIF, 'report.md'), `# Verification report\n\nStatus: ok\n\nExtracted fields: ${Object.keys(final).join(', ')}\n`);
  return { r4, conflicts: null };
}

async function dryRun() {
  ensureDirSync(OUTDIR);
  ensureDirSync(DEFAULT_DIAG);
  const ver = extractR4Fields();
  const times = enumerateTimestamps(START_RAW, END_RAW, INTERVAL_MINUTES);
  const manifest = { url: URL, interval_minutes: INTERVAL_MINUTES, start: toUTCISOString(START_RAW), end: toUTCISOString(END_RAW), planned_captures: [] , verification: ver };
  times.forEach(dt => { manifest.planned_captures.push({ ts: dt.toISOString(), filename: `${dt.toISOString()}.png` }); });
  fs.writeFileSync(path.join(OUTDIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Dry-run complete. Manifest written to', path.join(OUTDIR, 'manifest.json'));
  if (ver.conflicts) {
    console.error('R4 vignette conflicts detected; see', path.join(DEFAULT_VERIF, 'conflicts.json'));
    process.exit(3);
  }
}

// Core capture implementation
async function runCaptures() {
  // lazy require heavy deps
  const { chromium } = require('playwright');
  let pixelmatch = null; let PNG = null;
  try { pixelmatch = require('pixelmatch'); PNG = require('pngjs').PNG; } catch (e) {
    console.warn('pixelmatch/pngjs not installed. Install via `npm ci` in Agents to enable stability checks.');
  }

  ensureDirSync(OUTDIR); ensureDirSync(DEFAULT_DIAG); ensureDirSync(DEFAULT_VERIF);
  const verification = extractR4Fields();
  if (verification.conflicts) {
    console.error('Conflicts found in R4 extraction. See verification/conflicts.json and report.md');
    process.exit(4);
  }

  const times = enumerateTimestamps(START_RAW, END_RAW, INTERVAL_MINUTES);
  const manifest = { url: URL, interval_minutes: INTERVAL_MINUTES, start: toUTCISOString(START_RAW), end: toUTCISOString(END_RAW), captures: [], verification: verification.r4 };

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // collect console and network events
  const consoleMsgs = [];
  page.on('console', msg => {
    try { const text = msg.text(); if (!/MAPBOX|TOKEN|KEY/i.test(text)) consoleMsgs.push({ type: msg.type(), text }); } catch (e) {}
  });
  const network = [];
  page.on('request', r => network.push({ type: 'request', url: r.url(), method: r.method() }));
  page.on('response', resp => network.push({ type: 'response', url: resp.url(), status: resp.status() }));

  for (const dt of times) {
    console.log('Starting capture for', dt.toISOString());
    let attempt = 0; let stable = false; let lastMeta = null;
    while (attempt < MAX_RETRIES && !stable) {
      attempt++;
      try {
        await page.goto(URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(RENDER_WAIT_MS);

        // ensure scenario selection - attempt to find and click "100-Year + SLR"
        const scenarioConfirmed = await ensureScenarioSelected(page);
        if (!scenarioConfirmed) {
          // capture diagnostic screenshot and fail
          const diagShot = path.join(DEFAULT_DIAG, `scenario_mismatch_${dt.toISOString().replace(/[:]/g,'-')}.png`);
          await page.screenshot({ path: diagShot, fullPage: true });
          fs.writeFileSync(path.join(DEFAULT_DIAG, `console_${dt.toISOString()}.log`), JSON.stringify(consoleMsgs, null, 2));
          throw new Error(`Could not confirm scenario "100-Year + SLR". Diagnostic saved to ${diagShot}`);
        }

        // find canvas
        const canvasHandle = await page.$('canvas');
        let clip = null;
        if (canvasHandle) clip = await canvasHandle.boundingBox();

        // stability checks: capture 3 rapid frames
        let imgs = [];
        for (let i = 0; i < 3; i++) {
          const buf = await page.screenshot({ clip, fullPage: !clip });
          imgs.push(buf);
          await page.waitForTimeout(150);
        }

        let diffPct = 0;
        if (pixelmatch && PNG) {
          const p0 = PNG.sync.read(imgs[0]);
          const p1 = PNG.sync.read(imgs[1]);
          const p2 = PNG.sync.read(imgs[2]);
          const w = p0.width; const h = p0.height;
          const buf01 = Buffer.alloc(w*h*4);
          const buf12 = Buffer.alloc(w*h*4);
          const diff01 = pixelmatch(p0.data, p1.data, buf01, w, h, {threshold: 0.1});
          const diff12 = pixelmatch(p1.data, p2.data, buf12, w, h, {threshold: 0.1});
          const avgDiff = (diff01 + diff12) / 2;
          diffPct = avgDiff / (w*h);
          stable = diffPct <= STABILITY_THRESHOLD_PCT;
        } else {
          // if no pixelmatch available, assume stable after single capture
          stable = true; diffPct = 0;
        }

        lastMeta = { attempt, stable, diffPct };
        if (!stable) {
          console.warn(`Render unstable (diffPct=${diffPct}). Retrying (${attempt}/${MAX_RETRIES})`);
          await page.reload({ waitUntil: 'networkidle' });
          continue;
        }

        // persist final image and metadata
        const filenameBase = `${dt.toISOString().replace(/[:]/g,'-')}`;
        const pngPath = path.join(OUTDIR, filenameBase + '.png');
        fs.writeFileSync(pngPath, imgs[2]);
        const checksum = sha256(imgs[2]);
        const metadata = {
          ts_utc: dt.toISOString(), url: URL, viewport: { width: 1920, height: 1080 }, filename: path.relative(process.cwd(), pngPath), checksum, r4_vignette: verification.r4.extracted, stability: lastMeta, retries: attempt-1, console: consoleMsgs.slice(-200), network: network.slice(-200)
        };
        fs.writeFileSync(pngPath + '.json', JSON.stringify(metadata, null, 2));
        manifest.captures.push({ ts: dt.toISOString(), file: pngPath, metadata: pngPath + '.json', checksum });
        console.log('Saved capture', pngPath);
        // success, break retry loop
        break;
      } catch (err) {
        console.error('Capture attempt failed:', err.message || err);
        // on last attempt, gather diagnostics
        if (attempt >= MAX_RETRIES) {
          const diagPrefix = path.join(DEFAULT_DIAG, `${dt.toISOString().replace(/[:]/g,'-')}`);
          try { await page.screenshot({ path: diagPrefix + '.png', fullPage: true }); } catch (e) {}
          fs.writeFileSync(diagPrefix + '.console.json', JSON.stringify(consoleMsgs, null, 2));
          fs.writeFileSync(diagPrefix + '.network.json', JSON.stringify(network, null, 2));
          manifest.captures.push({ ts: dt.toISOString(), error: (err.message||String(err)), diagnostics: { console: diagPrefix + '.console.json', network: diagPrefix + '.network.json' } });
        }
      }
    }
    // wait until next capture time
    await page.waitForTimeout(INTERVAL_MINUTES * 60000);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUTDIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(DEFAULT_VERIF, 'report.md'), `# Verification/Run Report\n\nCaptures: ${manifest.captures.length}\n`);
  console.log('Completed captures; manifest saved to', path.join(OUTDIR, 'manifest.json'));
}

// Try to set or confirm the scenario on the page
async function ensureScenarioSelected(page) {
  try {
    // look for inputs or buttons containing the label text
    const scenarioConfirmedTexts = ['100-Year + SLR','100-Year+SLR','100 Year + SLR','100-Year'];
    for (const text of scenarioConfirmedTexts) {
      // query by visible text
      const btn = await page.$(`text="${text}"`);
      if (btn) {
        try { await btn.click({ timeout: 1000 }); } catch (e) {}
        // if visible, assume it confirms selection
        const visible = await page.$(`text="${text}"`);
        if (visible) return true;
      }
    }
    // fallback: try to find a legend or label containing "100-Year"
    const contains = await page.$(`text=/100[- ]?Year/i`);
    if (contains) return true;
    return false;
  } catch (e) { return false; }
}

(async function main(){
  try {
    if (DRY_RUN) { await dryRun(); process.exit(0); }
    else { await runCaptures(); process.exit(0); }
  } catch (err) {
    console.error('Error during capture:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
