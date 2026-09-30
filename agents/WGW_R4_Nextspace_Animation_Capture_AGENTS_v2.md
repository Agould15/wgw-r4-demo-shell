# Codex Task Brief V2: WGW R4 Demo Capture + Offline Playback Shell

Use this file as the working agent brief when modifying the What Gets Wet (WGW) R4 demo experience.

This V2 replaces the earlier animation-capture-only brief and aligns the capture workflow and HTML playback shell to the latest **WGW R4 Demo Filmmaker + Cast Guide V5**.

## Mission

Build and validate a **portable, offline-first demo package** for the WGW R4 session.

The package has two responsibilities:

1. **Capture / edit support**
   - Help Anthony record the required Nextspace vignettes at high quality.
   - Preserve consistent framing, rendering, timing, and visual fidelity.
   - Support time-step / scenario capture where needed.

2. **Conference playback**
   - Present the final vignettes through a local HTML experience that feels like a natural extension of Nextspace.
   - Let Anthony and Matt choose clips non-linearly, pause, replay, skip optional material, and hold on strong final frames.
   - Work **without internet access and without requiring a local web server**.

Core principles:

> **The presenters drive the room. The video supports the presenters.**

> **The digital twin is the visual stage. The reusable context is the hero.**

Do not turn this into a feature tour, playlist, training experience, slideshow, or chatbot demo. It should feel like an engineering investigation.

---

## Latest vignette flow

1. **Live opening / engineering question** — landing state only; no launcher video required.
2. **What might happen?** — hydro model, time progression, scenarios, exposure metrics.
3. **What else is affected?** — Branford WPCF → connected sewer service area → dependent buildings.
4. **Can the system explain why?** — Ask Nextspace anchor question, evidence boundaries, validation gaps.
5. **What does AQ know?** — optional Ask follow-up using Four Shore material.
6. **Can the context be reused?** — return from Ask to the same twin entities.
7. **What changed over time?** — Tweed past → present → planned future.
8. **What is inside the building?** — New Haven medical clinic BIM / AEC + Operate.
9. **What could we change?** — future-state intervention / compare.

The launcher should expose only the video-backed vignettes. The live opening remains the initial landing state.

## Vignette manifest

| ID | Launcher title | File | Status | Story |
|---|---|---|---|---|
| `model` | **What might happen?** | `01-model-event.mp4` | Core | Hydro model, start/rising/peak/recession, scenario comparison, exposure metrics |
| `branford` | **What else is affected?** | `02-branford-dependency.mp4` | Core | WPCF → sewer service area → dependent buildings |
| `ask` | **Can the system explain why?** | `03-ask-anchor.mp4` | Core | Anchor Ask question, evidence types, validation gaps |
| `aq` | **What does AQ know?** | `04-aq-transferable.mp4` | Optional | Four Shore guidance: what transfers vs. what does not |
| `reuse` | **Can the context be reused?** | `05-reuse-context.mp4` | Core | Return from Ask to same places / entities in the twin |
| `tweed` | **What changed over time?** | `06-tweed-time.mp4` | Core | Historical evidence, current airport, modeled condition, planned future |
| `bim` | **What is inside the building?** | `07-clinic-bim.mp4` | Core | Region → building → electrical system → operational dependency |
| `decide` | **What could we change?** | `08-decide-compare.mp4` | Core/Future | Baseline → intervention → compare |

Optional geography clips may live under `videos/extras/`, but do **not** add them to the primary launcher unless Anthony explicitly asks.

### Launcher copy

Drawer title:

> **Context in Action**  
> *What Gets Wet · Anchor QEA + Slalom*

Card descriptions:

- **What might happen?** — Follow modeled water through time.
- **What else is affected?** — Trace exposure into services and dependencies.
- **Can the system explain why?** — Reason across models, relationships, evidence, and uncertainty.
- **What does AQ know?** — Bring documented engineering knowledge into the same context. `OPTIONAL`
- **Can the context be reused?** — Return to the same canonical places and relationships.
- **What changed over time?** — Connect historical evidence, current conditions, and a planned future.
- **What is inside the building?** — Move from regional exposure into systems, assets, and operations.
- **What could we change?** — Compare a future intervention with the baseline. `FUTURE`

Do not show step numbers, progress bars, “next,” percentages, or a required sequence.


---

## Important domain / content corrections

### Branford asset name

Use:

> **Branford Water Pollution Control Facility (WPCF)**

Do not use:
- Branford Water Treatment Plant
- Branford Water District
- potable water treatment terminology

The CT DEEP layer is:

> **Connected Sewer Service Areas**

It represents sanitary-sewer service areas and treatment-facility endpoints.

### Ask source attribution

The **Town of Branford Coastal Resilience Plan** must not be attributed to Anchor QEA.

The Ask experience should distinguish:
- Town of Branford plan / local documented findings
- modeled WGW exposure
- explicit service relationships
- Anchor QEA Four Shore guidance
- inference
- unknown / requires validation

Preferred evidence labels:
- **Documented / regulatory**
- **Modeled**
- **Connected**
- **Expert guidance**
- **Inference**
- **Unknown / requires validation**

Avoid calling Town statistics or plan statements “observed” unless they are truly observational measurements.

### Ask prompts

Preferred anchor question:

> **Using the sources and modeled context available here, what do we know about flood risk to the Branford Water Pollution Control Facility and the wider consequence if service is disrupted? Separate documented evidence, modeled exposure, explicit service relationships, documented mitigation, transferable engineering guidance, and what still requires validation. Cite the source for each.**

Optional follow-up:

> **What from Anchor QEA’s Four Shore Coastal Resiliency Plan is transferable here — and what is not?**

These prompts guide the Ask videos; the HTML shell does not need to display them unless Anthony requests it.

---

## Capture workflow

### Inspect before automating

Review:
- the V5 Filmmaker + Cast Guide,
- actual Nextspace environment,
- current scenario,
- required layers,
- viewport/browser scaling,
- timing/rendering controls,
- any current Operator UI changes.

Do not invent workflows that have not been verified.

Label UI-specific guidance as:
- **New UI**
- **Old UI**
- **Available in Both**

### Capture standard

Use:
- 1920×1080 final composition
- 30 fps
- stable browser zoom
- identical Nextspace viewport dimensions
- same OS scaling
- same native top-left 9-dot launcher position
- no presenter narration
- no notification overlays

Record:
- 3–5 seconds clean before first interaction
- all meaningful interactions
- at least 5 seconds clean after final state
- a second take when practical
- a clean still of the final landing frame

Avoid:
- mouse wandering
- loaders
- browser tab switching
- unnecessary scrolling
- repeated panel hunting
- accidental zoom/orbit moves

Every vignette must end on a stable frame. **Do not fade to black.** The final frame is a stage backdrop.

### Hydro / time-series capture safeguards

Preserve the earlier capture discipline:

1. Advance one interval at a time.
2. Keep scenario, camera, map extent, layer styling, legend, and visible overlays constant.
3. Wait for WebGL/map rendering to settle.
4. Prefer a real app loading signal.
5. If none exists, use a configurable visual-settling detector.
6. Do not use network-idle alone as proof rendering is complete.
7. Save lossless PNG frames when creating a time-lapse source sequence.
8. Keep a CSV/JSON manifest with scenario, variable, time-step index, modeled time, capture time, dimensions, settling duration, and warnings/failures.
9. Preserve original PNGs even if an MP4 derivative is produced.
10. Pilot early, middle, and late steps before a full run.

If Anthony is capturing manually in screen recording, do not force automation into the workflow.


---

# Offline playback shell — hard requirement

## The primary build MUST work from `file://`

The conference build must **not require**:

- `python -m http.server`
- Node
- npm
- Vite
- React
- a development server
- localhost
- internet access
- CDN assets
- remote fonts
- remote JavaScript libraries
- service workers
- authentication
- Nextspace being online

Anthony must be able to:

1. unzip the demo folder,
2. double-click `index.html`,
3. open it in a modern browser,
4. run the full demo from local files.

This is a hard requirement.

## How to make `file://` reliable

Refactor the current implementation if it depends on a server.

### Do

- use standard `<script>` tags, not ES modules
- use inline CSS/JS or ordinary local files
- use local relative paths
- use direct `<video src="videos/...">` references
- use direct `<img src="assets/...">` references
- keep the vignette manifest inline or in a normal local JS file
- handle missing media gracefully
- use browser-native video playback
- start playback only after a user click
- test pause, seek, replay, and switching clips from `file://`

### Do not

- use `fetch()` to load local JSON
- use dynamic `import()`
- use `<script type="module">`
- depend on CORS headers
- use service-worker caching
- make XHR requests to local files
- require a build step at presentation time
- require a server just to resolve paths

Modern browsers can restrict local `fetch()` and module behavior under `file://`. Design around those restrictions.

---

## Preferred final code architecture

For maximum reliability, favor a **single self-contained `index.html`** for code and styling, with media kept as local files.

Recommended:

```text
WGW_R4_Demo/
├── index.html
├── videos/
│   ├── 01-model-event.mp4
│   ├── 02-branford-dependency.mp4
│   ├── 03-ask-anchor.mp4
│   ├── 04-aq-transferable.mp4
│   ├── 05-reuse-context.mp4
│   ├── 06-tweed-time.mp4
│   ├── 07-clinic-bim.mp4
│   ├── 08-decide-compare.mp4
│   └── extras/
├── assets/
│   ├── posters/
│   ├── sources/
│   └── icons/
├── README_OFFLINE.txt
└── CHECK_BEFORE_PRESENTING.txt
```

Preferred:
- CSS inline in `index.html`
- application JS inline at bottom of `index.html`
- vignette manifest inline in JS

If Codex keeps `styles.css` and `app.js`, they must remain simple local files that work under `file://`.

Do **not** embed MP4s as base64 in the HTML. Keep videos as external local files.

## Portable paths

Use relative paths such as:

```text
videos/01-model-event.mp4
```

Do not use:
- absolute drive paths
- `/Users/...`
- Windows drive letters
- localhost URLs
- machine-specific paths

The package must survive moving folders, copying to Matt’s laptop, and unzipping somewhere else.


---

## Redundancy / Matt handoff

Create a ZIP containing the complete portable folder.

Expected deliverable:

```text
WGW_R4_Demo_Offline_v1.zip
```

After unzip, `index.html` must be the obvious entry point.

### README_OFFLINE.txt

Keep it extremely simple:

> 1. Unzip the full folder.  
> 2. Do not move the videos out of the folder structure.  
> 3. Open `index.html` in Chrome or Edge.  
> 4. Click the 9-dot launcher to choose a vignette.  
> 5. No internet connection is required.

### CHECK_BEFORE_PRESENTING.txt

Include:
- preferred browser
- all eight videos present
- all clips play
- no cloud-only placeholders
- notifications disabled
- browser zoom checked
- full-screen tested
- laptop power settings presentation-safe
- duplicate ZIP stored locally and on a second device/USB

## Optional fallback — not a dependency

Codex may include optional helper scripts:

- `fallback_server.command` for macOS
- `fallback_server.bat` for Windows

These may start a minimal local server **only for troubleshooting**.

They are not part of the normal workflow.

The primary build must still work by double-clicking `index.html`.

---

## HTML interaction requirements

### Closed state
- full-viewport video/poster
- single 9-dot launcher top-left
- launcher overlays/masks the equivalent launcher captured in Nextspace clips
- no surrounding Slalom frame
- no playlist UI

### Open state
Clicking launcher:
- pauses current video
- opens dark left drawer over video
- does not resize/push stage
- subtly dims stage
- preserves current frame behind drawer

### Selecting a vignette
- drawer closes
- selected clip loads
- playback starts from user click
- no auto-advance
- final frame holds

### Presenter controls
Subtle hover controls:
- play/pause
- restart
- mute
- current time/duration

Keyboard:
- `Space` play/pause
- `R` restart
- `Esc` close drawer
- `M` mute

Do not add shortcuts that encourage a rigid numbered sequence.

---

## Visual language

Use the supplied Nextspace screenshots as reference:

- charcoal / near-black panels
- soft gray / white type
- Nextspace-like blue accent
- rounded compact controls
- subtle borders
- restrained translucency
- minimal shadow

The wrapper should feel **native-adjacent**, not like an official Nextspace product clone.

The UI should disappear during the story.

---

## Landing state

On initial load:

- show a strong WGW regional poster/still
- do not autoplay
- show the 9-dot launcher
- drawer closed
- no error messages
- no server warning
- no developer controls

This landing state sits under Matt’s live opening.

---

## Missing-file behavior

During development some videos will be absent.

The shell must not break.

If a referenced video is missing:
- show its poster
- keep launcher functional
- show only a subtle presenter-facing message such as `Video not loaded yet`
- do not expose a browser broken-media icon

Before final packaging, validate that all expected media files exist.


---

## Testing matrix

Before completion, test the final **unzipped** package.

### Primary offline test

1. Disconnect internet / disable Wi-Fi.
2. Ensure no local server is running.
3. Double-click `index.html`.
4. Verify:
   - landing state loads
   - drawer opens
   - all cards render
   - all videos load from local disk
   - play/pause works
   - replay works
   - final frame holds
   - drawer reopens during/after playback
   - switching clips works
   - local Tweed/BIM/source images load
   - no presentation-breaking console errors

### Browsers

At minimum test:
- current Google Chrome
- current Microsoft Edge if available

Test Safari on macOS if it is likely to be used, but Chrome/Edge should be the documented preferred browsers.

### Portability test

Move/unzip the package into a different folder path and retest.

If practical, test on a second machine.

Do not call the package portable until this passes.

---

## ZIP packaging task

Create a repeatable packaging step that:

1. validates expected files,
2. creates the clean `WGW_R4_Demo/` folder,
3. excludes:
   - `.git`
   - source recordings
   - render caches
   - browser profiles
   - credentials
   - development dependencies
   - temp files
4. writes `README_OFFLINE.txt`
5. writes `CHECK_BEFORE_PRESENTING.txt`
6. creates:

```text
WGW_R4_Demo_Offline_v1.zip
```

7. optionally creates a SHA-256 checksum file.

Do not require Anthony or Matt to install anything to run the packaged demo.

---

## Version control

Keep the source project separate from the conference package.

Example:

```text
repo/
├── src/
├── assets/
├── videos-working/
├── docs/
│   ├── AGENTS.md
│   └── WGW_R4_Demo_Filmmaker_Cast_Guide_v5.md
├── dist/
│   └── WGW_R4_Demo/
└── package-offline.*
```

`dist/` is the presentation artifact.

GitHub is for version control, not runtime.

The demo must work even if GitHub, Slalom network access, and the internet are unavailable.

---

## Completion checks

### Narrative
- launcher order matches V5
- launcher titles match this brief
- AQ follow-up is labeled optional
- obsolete standalone “Show me how you know” card is removed unless Anthony restores it

### Content
- Branford WPCF naming is correct
- Town of Branford plan is not attributed to AQ
- sewer-service relationship is described accurately
- Ask does not claim unsupported outage/failure
- Tweed/BIM source images are stored locally

### Playback
- no internet required
- no local server required
- no build process required
- `index.html` works through `file://`
- relative paths survive moving the folder
- final frames hold
- no auto-advance

### Redundancy
- ZIP created
- README included
- preflight checklist included
- tested after unzip
- alternate-path or second-machine test completed when possible

### Security
- no credentials
- no cookies
- no browser profiles
- no secrets
- no unrelated client data

---

## Immediate Codex request

Using the current HTML experience as the starting point:

1. inspect the existing implementation;
2. update the vignette manifest and launcher to match this V2 brief;
3. remove/replace obsolete vignette names from earlier versions;
4. refactor the production build so `index.html` opens directly from disk with no server;
5. eliminate server-only patterns such as local `fetch()` or ES-module dependencies where they interfere with `file://`;
6. preserve the Nextspace-native-adjacent launcher/drawer design;
7. create the portable folder structure;
8. create the ZIP packaging workflow;
9. validate the package offline;
10. report:
   - what changed,
   - what was tested,
   - which browsers passed,
   - remaining limitations,
   - exact output paths.

Do not claim offline portability until the unzipped package has been tested with Wi-Fi disabled and no local server running.

---

## Product principle

> **The UI should disappear so the audience can focus on the story.**

> **Ask is one surface. The twin is another. The context underneath is the asset.**
