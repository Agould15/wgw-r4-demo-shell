# Capture Attempt Summary

Summary of automated capture attempts for the Anchor QEA "What Gets Wet" R4 vignette.

What I tried
- Dry-run manifest generation and a Playwright scaffold (`Agents/capture.js`) to plan timestamps.
- Headless single-capture runs (Playwright) — produced diagnostics but failed due to auth/session differences and navigation timeouts.
- CDP attach workflow (`Agents/connect_and_capture.js`) to use your authenticated Chrome session and capture screenshots.
- Batch CDP capture (`Agents/capture_authenticated_batch.js`) with features added iteratively:
  - CLI dry-run, record/replay of user clicks (`--record-actions` / `--replay-actions`).
  - Multiple programmatic time-setting attempts against in-page APIs (`window.__wgw` / `window.wgw`).
  - A `--probe` mode that dumps available in-page functions to `Agents/diagnostics/probe.json`.
  - Navigation retries, render-stability checks (hash-based), and canvas cropping to reduce noise.

What succeeded
- Generated a manifest and saved planned timestamps (`Agents/captures/manifest.json`).
- Recorded user interactions to `Agents/diagnostics/user_actions.json` and replayed them.
- Probed in-page API and discovered methods: `lift`, `state`, `measure`, `read`, `at`, `many`, `probe`, `sweep` (see `Agents/diagnostics/probe.json`).
- Using the discovered `at(lon, lat)` method plus replayed actions produced several authenticated captures saved in `Agents/captures/` (files prefixed `auth_capture_...`) along with per-image metadata.

Why the overall automation was unreliable
- `page.goto` to the target URL often timed out (networkidle) because the app establishes WS and backend connections that differ between headless and user browsers.
- The in-page API surface is dynamic: `window.__wgw` exists but some APIs or state are not always present or require specific call signatures/objects the script couldn't infer automatically.
- The application uses complex async rendering and server-side data loads (WebSocket/stateful services). Deterministic capture needs either:
  - direct, documented control APIs (exact function names and argument shapes), or
  - human-driven interactions at time-of-capture.

Artifacts produced
- Scripts: `Agents/capture_authenticated_batch.js`, `Agents/connect_and_capture.js`, `Agents/capture.js` (scaffold).
- Captures: `Agents/captures/auth_capture_*.png` (+ `.json` metadata) and earlier `cdp_capture_*.png`.
- Diagnostics: `Agents/diagnostics/` containing network and console logs, `user_actions.json`, and `probe.json`.

Recommended next steps
1. Manual (fastest): take a small set of manual authenticated screenshots while following a short checklist (hide timeline, set time via DevTools if needed). I can provide exact DOM/console commands to run in the browser to get deterministic state.
2. Programmatic (reliable): use the precise in-page API discovered in `probe.json` — I can write a deterministic sequence (e.g., call `at(lon,lat)`, then `probe()` or `read()` to confirm state, then capture) once you confirm the correct call signatures or allow me to probe deeper interactively.
3. Deliver artifacts: I can package the current captures + diagnostics into a ZIP for handoff and include a short runbook for a human to finish the remaining screenshots.

If you want any of the recommended follow-ups, say which one and I will implement it (or produce the quick manual checklist) and package the artifacts if requested.

---
Generated: 2026-09-28
