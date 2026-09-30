Title: Anchor QEA — "What Gets Wet" (WGW) Codex Task Brief — R4 Vignette Verification + Interval PNG Capture

Purpose
- Implement an automated, reproducible capture workflow that produces interval PNG screenshots of the open WGW demo scene and verifies the R4 vignette details against repository materials (do not guess values).
- Deliver runnable scripts, a README, a capture manifest, sample PNGs, and a short verification evidence report showing which files were read and which R4 vignette fields matched.

Context & Important links
- Open demo scene (use this exact URL): 
  https://anchorqea1.nav.nextspace-uat-us-nj.net/?viewId=d3a2b714&bookmarkId=AGQOSVHY3B2GJPAEG6UU7PTWIM&lon=-72.81564&lat=41.1636&alt=7456.931&pitch=-34.29&heading=338.43
- Repo workspace (local): the user has created an `Agents` folder for deliverables.
- Required: verify R4 vignette details from available repo materials (do not invent). Relevant files to check for R4 detail verification (read these and confirm values):
  - `docs_inventory_review.md` (inventory notes)
  - `current_state.md`
  - `docs/12_milestone_1/01_Milestone_1_Executive_Summary.md`
  - `docs/04_data/netcdf_hydro_model_import_visualization.md`
  - `docs/03_architecture/target_architecture.md`
  - `project_brief.md`
  - any ADRs in `decisions/` relevant to R4 (e.g., `ADR-0001*`, `ADR-0002*`, `ADR-004*`)
  - If an explicit R4 vignette doc exists, use it; otherwise derive R4 parameters only from those files.

- Scenario to capture: `100-Year + SLR`. Use the provided screenshot to validate UI selections (radio buttons and event-time controls) and ensure the scene is set to `100-Year + SLR` before starting captures.

Inputs (from user / environment)
- The demo URL above (use exact parameters).
- Local repo files listed above (read securely from the filesystem; do not hardcode or require secrets).
- Capture window and interval: start at July 13, 2000 19:00 Eastern (7:00pm ET) and capture 30-minute snapshots through July 15, 2000 08:00 Eastern (8:00am ET). Do NOT default to a 24-hour run; use this fixed capture window unless explicitly overridden. The script should accept override environment variables: `INTERVAL_MINUTES`, `CAPTURE_START_ISO`, `CAPTURE_END_ISO`, `TOTAL_HOURS`, and `CAPTURE_COUNT`. Default `INTERVAL_MINUTES` is 30.
- Output folder (default): `Agents/captures/` inside workspace.

Environment & Dependencies
- Prefer Node + Playwright or Puppeteer (Chromium) for reliable rendering and modern headless control. Playwright is preferred for better stability; if you use Playwright list commands to install and run.
- Node requirement: provide `package.json` (scripts), or a small `Makefile`.
- Do not require Mapbox or other tokens to be committed in the repo — use the user's environment if needed (read via env vars). If a token is required to render the scene, detect and fail with a clear error message that instructs the user where to set `MAPBOX_TOKEN` or other provider secrets (do not print or log secrets).
- Provide reproducible steps in `Agents/README.md` (install, run, expected outputs).

Capture workflow (step-by-step)
1. Validate R4 vignette values:
   - Read the files listed under "Inputs" and extract R4-specific fields (e.g., scenario name, time step cadence, dataset IDs, NetCDF variables, AOI, vertical datum, model provenance). Create a small JSON `Agents/verification/r4_vignette_source.json` capturing the extracted fields and their source file/line (where possible).
   - If conflicting values are found across files, record all candidates in `r4_vignette_source.json` and mark conflicts in `Agents/verification/conflicts.json`. Do NOT guess a resolution—stop and list conflicts for the user to adjudicate.
2. Start browser and navigate:
   - Launch Chromium via Playwright/Puppeteer. Use non-headless optionally for debugging, but default to headless with GPU flags if applicable.
   - Set viewport large enough for high-resolution PNGs (e.g., 3840x2160) and ensure device scale factor is 1 or configurable.
   - Navigate to the exact URL. Wait for the scene to render fully:
     - Wait for network idle and for the map/container canvas element to be present.
     - Implement tile/load detection: inspect relevant DOM elements or JS variables (e.g., tile layers, request queue) to ensure tiles are loaded. If there is a Nextspace API event or `window` flag indicating completed rendering, wait for it.
     - Add a configurable `RENDER_WAIT_MS` (default 3000ms) after network idle to allow final compositing.
3. Rendering-stability checks before each capture:
   - Capture three rapid screenshots (100–300ms apart) of the map canvas and compute pixel diffs:
     - If diffs between the last two are below a tiny threshold (e.g., <0.1% differing pixels) consider rendering stable.
     - If not stable within N retries (default 5), log the issue and retry full navigation or reload. Record retry counts and reasons.
   - Verify UI overlays (legends, scenario/time labels) exist if present in the scene; if a scenario/time overlay is expected per R4 vignette, ensure the label text matches extracted R4 fields.
4. Capture frame:
   - Capture a full PNG of the map canvas (crop to the demo's primary canvas rather than full page when possible).
   - Save file with timestamped filename and meta: `Agents/captures/{ISO8601}_lon{lon}_lat{lat}_alt{alt}_pitch{pitch}_heading{heading}.png`.
   - In parallel, write a JSON metadata file alongside each PNG with:
     - URL, extracted R4 vignette fields, viewport, timestamp (UTC), render times, stability-check stats, retry counts, and checksum (SHA256).
5. Interval scheduling:
   - Run capture every `INTERVAL_MINUTES` until `TOTAL_HOURS` or `CAPTURE_COUNT` is reached.
   - Implement a robust sleep/wait between captures and a safe shutdown procedure (graceful on SIGINT).
6. Post-processing & manifest:
   - Produce a manifest `Agents/captures/manifest.json` listing all captures, metadata paths, checksums, and verification status.
   - Generate a short report `Agents/verification/report.md` summarizing:
     - R4 vignette fields discovered and source files.
     - Any conflicts or missing R4 fields.
     - Number of captures, any failed captures and reasons, and a sampling of render-stability stats.
   - Optionally create a zip `Agents/captures_{startISO}_{endISO}.zip` of PNGs and metadata.

Error handling & retries
- If required R4 fields are missing from repo files, do not guess. Stop, write `Agents/verification/missing_fields.json` listing missing items, and exit with non-zero but clear message instructing the user which files to update.
- If rendering fails repeatedly (e.g., unstable tiles after retries), capture a diagnostic bundle:
  - Save browser console logs, network HAR (if allowed), and a small video (optional) to `Agents/diagnostics/`.
- All failures must be reported in `Agents/verification/report.md` with actionable next steps.

Security & privacy
- Never write tokens, credentials, or secrets to logs or commits.
- If a token is detected in the environment, note in the README how to supply it securely (env var) and do not print it.
- Do not attempt to upload captures to external services — store outputs locally only.

Deliverables (place in `Agents/` folder)
- `Agents/capture.js` or `Agents/capture.ts` (Playwright or Puppeteer script) with CLI flags:
  - `--interval`, `--hours`, `--count`, `--outdir`, `--headless=false`, `--render-wait-ms`, `--max-retries`.
- `Agents/package.json` and `Agents/package-lock.json` (or `requirements.txt` if Python).
- `Agents/README.md` with install/run steps and examples.
- `Agents/verification/r4_vignette_source.json` and `Agents/verification/conflicts.json` (if applicable).
- `Agents/verification/report.md` (evidence that R4 values were verified).
- `Agents/captures/` with sample PNGs (if run) or instructions for how to run to generate them.
- `Agents/diagnostics/` (if any issues or optional sample).
- `Agents/manifest.json` summarizing captures and metadata.

Acceptance criteria (what I will check)
- Script runs locally with documented steps and produces screenshots saved under `Agents/captures/`.
- `Agents/verification/r4_vignette_source.json` lists R4 vignette fields and source file references (no guesses).
- If any R4 field is missing or conflicting, `Agents/verification/conflicts.json` and `report.md` explain the conflict and stop-for-user-decision.
- Each PNG has an adjacent metadata JSON and a SHA256 checksum recorded in `manifest.json`.
- Render-stability checks are implemented with retry logic and recorded stats.
- README includes how to run, how to override interval/duration, and how to supply any required tokens via env vars.
- No secrets are written to files or logs.

Implementation hints for Codex
- Prefer Playwright: `npm i -D playwright`. Use `const { chromium } = require('playwright');`
- To detect canvas: query `document.querySelector('canvas')` or the Nextspace map container; use page.evaluate to poll for `map` or `viewer` ready flags if available.
- For pixel-diff: capture raw PNG buffers and use `pixelmatch` (Node) or `sharp` to compare.
- For HAR and console logs: use Playwright tracing or intercept network events.
- Keep code modular and testable. Provide a `--dry-run` mode that validates R4 fields and prints manifest without taking screenshots.

Questions for user if needed (Codex should ask only if necessary)
- Confirm desired capture duration or count; if not provided, use defaults (`INTERVAL_MINUTES=30`, `TOTAL_HOURS=24`).
- Confirm preference between Playwright (recommended) or Puppeteer.

Finish & Handoff
- Save all deliverables under `Agents/`.
- Add short run example at end of `Agents/README.md`, e.g.:
  ```bash
  cd /path/to/repo
  cd Agents
  npm ci
  INTERVAL_MINUTES=30 TOTAL_HOURS=24 node capture.js
  ```
- When complete, produce `Agents/verification/report.md` and point to `Agents/captures/manifest.json`.

End of Codex prompt.
