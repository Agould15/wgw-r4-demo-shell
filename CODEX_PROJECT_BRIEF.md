# Codex Project Brief — WGW R4 Demo Shell

Build a static, local-first web experience for presenting pre-recorded Nextspace demo vignettes at R4.

## UX
1. Full-screen current video/poster.
2. 9-dot launcher in the native Nextspace upper-left location.
3. Clicking it pauses the clip and opens a dark left drawer over the stage.
4. Cards use question titles, not numbered steps.
5. Selecting a card closes the drawer and plays that MP4.
6. At video end, keep the last frame.
7. No auto-advance.

## Critical trick
The recorded Nextspace video already contains the native launcher. Mask that small area and place the HTML 9-dot launcher exactly on top so the wrapper feels integrated and there is no duplicate chrome.

## Constraints
- plain HTML/CSS/JavaScript for MVP;
- no frameworks required;
- no external network calls;
- no CDN or web fonts;
- all media local;
- optimized for 1920×1080;
- accessible focus states;
- no playlist/progress UI.

## Expected videos
- `01-model-time.mp4`
- `02-branford-consequence.mp4`
- `03-ask-context.mp4`
- `04-evidence-boundary.mp4`
- `05-reuse-context.mp4`
- `06-tweed-time.mp4`
- `07-clinic-bim.mp4`
- `08-decide-compare.mp4`

## Definition of done
- launcher overlays the captured Nextspace launcher area;
- drawer opens/closes smoothly without resizing the stage;
- selected clip plays;
- clip can pause/restart;
- final frame holds;
- missing video falls back to its poster;
- works offline;
- simple enough to hand to another Slalom developer.

> **The digital twin is not the hero. Ask is not the hero. The reusable context underneath them is the hero.**
