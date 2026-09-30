Codex Implementation Task: Full WGW Capture Pipeline

Goal
- Implement a production-ready Node.js Playwright capture pipeline that extends the existing scaffold (`Agents/capture.js`) into a full-featured tool implementing the acceptance criteria in `Agents/Codex_Task_Brief.md`.

Primary requirements (must implement exactly)
1. Capture window & scenario
   - Use the fixed capture window: start July 13, 2000 19:00 Eastern (7:00pm ET) and capture 30-minute snapshots through July 15, 2000 08:00 Eastern (8:00am ET).
   - Ensure the scene/scenario control is set to `100-Year + SLR` before capturing. If the UI must be interacted with, programmatically set the radio/button control; if selectors are not obvious, implement a robust selector-fallback strategy (aria text, label text, visible button text). Do not proceed until the scenario is confirmed.

2. Playwright-based capture with stability checks
   - Use Playwright (Chromium). Provide `Agents/package.json` updates and installation instructions.
   - Implement rendering-stability checks before each capture by taking three rapid canvas screenshots (100–300ms apart) and using `pixelmatch` to compare. Use a configurable threshold (default 0.1% differing pixels) and retry up to 5 times before logging a failure for that capture.
   - Capture only the demo map canvas when available (fallback to full-page screenshot if canvas not found).

3. Verification & R4 vignette extraction
   - Read the repository files listed in `Agents/Codex_Task_Brief.md` (e.g., `docs_inventory_review.md`, `current_state.md`, `docs/12_milestone_1/...`) and extract required R4 vignette fields (scenario name, time-step cadence, dataset IDs, NetCDF variables, AOI, vertical datum, model provenance). Write `Agents/verification/r4_vignette_source.json` with parsed values and source references (file paths and approximate line numbers where applicable).
   - If conflicting values exist across files, write `Agents/verification/conflicts.json` listing candidates and sources. Stop automated capture and mark verification status as `conflict` in `Agents/verification/report.md`.

4. Metadata, manifest & checksums
   - For each PNG, write an adjacent JSON with URL, viewport, timestamp (UTC), R4 vignette fields used, render-stability stats, retry counts, SHA256 checksum, and any console/network issues recorded.
   - Maintain `Agents/captures/manifest.json` containing the list of captures, metadata paths, checksums, and overall verification status.

5. Diagnostics & logging
   - On failure or instability, capture browser console logs and (optionally) a HAR using Playwright network tracing into `Agents/diagnostics/`.
   - All logs must avoid printing tokens/secrets; treat environment variables named `*TOKEN*`, `*KEY*`, or `MAPBOX*` as secrets and never log their values.

6. CLI, env vars & modes
   - Provide CLI flags and env vars (priority order):
     - `--start` / `CAPTURE_START_ISO`
     - `--end` / `CAPTURE_END_ISO`
     - `--interval` / `INTERVAL_MINUTES` (default: 30)
     - `--url` / `CAPTURE_URL` (default: demo URL in `Codex_Task_Brief.md`)
     - `--outdir` / `OUTDIR` (default: `Agents/captures`)
     - `--render-wait-ms` / `RENDER_WAIT_MS` (default: 3000)
     - `--headless` (bool)
     - `--dry-run`
   - Implement a `--dry-run` that validates R4 extraction and writes the manifest without launching the browser.

7. Acceptance criteria (automated checks)
   - Running the script produces PNGs saved to `Agents/captures/` for the specified window and writes per-image metadata and a `manifest.json` including SHA256 checksums.
   - `Agents/verification/r4_vignette_source.json` must list extracted R4 fields and file sources.
   - If conflicts are present, `Agents/verification/conflicts.json` and `Agents/verification/report.md` explain them and the script exits with non-zero status.
   - Pixel-diff stability logic exists and is recorded in metadata.
   - README updated with install and run steps and examples.

Implementation expectations
- Keep code modular and testable. Use small functions for R4 extraction, scenario selection, stability checks, capture, and post-processing.
- Use `pixelmatch` and `pngjs` (or `sharp`) for image diffing.
- Use Playwright tracing APIs for HAR/console capture where available.
- Do not commit secrets; respect env vars.
- Provide helpful error messages explaining remediations (e.g., missing R4 fields, required `MAPBOX_TOKEN`).

Deliverables (place under `Agents/`)
- `capture.js` (or `capture.ts`), fully implemented with CLI flags.
- `package.json` and `package-lock.json` (or `pnpm-lock.yaml`).
- `Agents/README.md` updated with install/run steps and examples.
- `Agents/verification/r4_vignette_source.json`, `Agents/verification/conflicts.json` (if applicable), and `Agents/verification/report.md`.
- `Agents/captures/` sample PNGs and metadata (if run).
- `Agents/diagnostics/` (if any issues).
- `Agents/captures/manifest.json`.

Notes for Codex
- The project already contains a minimal scaffold (`Agents/capture.js`) — extend it rather than rewrite from scratch. Keep the existing `--dry-run` behavior.
- The scenario selection must explicitly set `100-Year + SLR` before captures start. Use DOM interaction to click the radio/button; if the control is not a standard HTML input, use visible text matching.
- Start/End times must be interpreted as local Eastern Time for the WGW model (convert to UTC for timestamps); default values are the fixed window specified above.

Run example (expected)

```bash
cd /Users/anthonygould/Documents/wgw-r4-demo-shell/Agents
npm ci
# dry run (validate extraction and schedule)
node capture.js --dry-run
# real run (headless)
node capture.js --start 2000-07-13T23:00:00Z --end 2000-07-15T12:00:00Z --interval 30
```

Acceptance test checklist (to include in `report.md`)
- [ ] Manifest contains entries for every 30-minute interval between the start and end timestamps.
- [ ] Each manifest entry has an adjacent metadata JSON and a valid SHA256 checksum.
- [ ] R4 vignette source JSON exists and has explicit source references.
- [ ] Pixel-diff stability checks recorded for at least one capture sample.
- [ ] README explains how to run and how to supply tokens via env vars.

If Codex cannot detect the scenario control reliably, it must fail with a clear error that includes screenshots showing the last-known UI state (saved to `Agents/diagnostics/`) and instruct the user how to supply more reliable selectors.

End of Codex handoff prompt.
