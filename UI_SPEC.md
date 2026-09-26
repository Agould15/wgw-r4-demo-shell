# WGW R4 Demo Shell — UI / Interaction Specification

## Objective
Create a local-first presentation shell that feels like a natural extension of Nextspace while remaining almost invisible during playback.

> **Give Matt and Anthony control over pre-recorded demo vignettes without making the audience feel like they are watching a playlist.**

## Closed state
- Full-screen video / poster occupies the viewport.
- A single 9-dot launcher is visible in the upper-left.
- The launcher sits directly over the native Nextspace launcher location in the recorded videos.
- A small matching mask under it hides the launcher captured inside the video, avoiding a double-icon effect.

## Open state
Clicking the launcher:
- pauses the active clip;
- opens a ~340 px dark left-side drawer over the stage;
- subtly dims the stage;
- never pushes or resizes the video.

## Selecting a vignette
- drawer collapses;
- selected clip loads full-screen and starts after the user click;
- clip contains no recorded narration;
- at completion, hold the final frame indefinitely.

## Drawer
Header:
**Context in Action**  
*What Gets Wet · Anchor QEA + Slalom*

Cards use question titles, one short description, and optional `OPTIONAL` / `FUTURE` badges. No step numbers or progress indicators.

## Recommended cards
- **What might happen?** — Follow modeled water through time.
- **What else is affected?** — Trace exposure into services and dependencies.
- **Can the system explain why?** — Ask across model, relationships, evidence, and AQ knowledge.
- **Show me how you know** — Keep evidence types and boundaries visible.
- **Can the context be reused?** — Return to the same canonical places and assets.
- **What changed over time?** — Connect historical evidence to a planned future.
- **What is inside the building?** — Move from regional risk into systems and assets.
- **What could we change?** — Compare a future intervention with the baseline.

## Controls
Visible only on hover / mouse movement:
- play/pause;
- restart;
- mute;
- elapsed / duration.

Keyboard:
- `Space` play/pause
- `R` restart
- `Esc` close drawer
- `M` mute/unmute

## Visual language
Use the provided screenshots as reference:
- charcoal / near-black panels;
- white and soft-gray type;
- bright blue active accent;
- rounded controls;
- subtle borders;
- restrained translucency;
- no Slalom presentation chrome around the video.

This should feel native-adjacent, not like a pixel-for-pixel clone.

## Offline requirement
Everything must work from local files:
- HTML/CSS/JS;
- MP4s;
- poster images;
- no CDN;
- no web fonts;
- no telemetry;
- no dependency on Nextspace or conference Wi-Fi.

## Recording standard
To keep the overlay launcher aligned:
- 1920×1080 capture;
- identical browser zoom;
- same Nextspace window dimensions;
- launcher in the same position;
- no resizing between vignettes.

## Principle
> **The UI should disappear so the audience can focus on the story.**
