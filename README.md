# What Gets Wet — R4 Demo Shell

Purpose: a static, offline demo wrapper for the "What Gets Wet — Context in Action" R4 presentation.

Contents:
- `index.html` — demo wrapper and player
- `vignettes.js`, `app.js`, `styles.css` — demo behavior and styles
- `videos/` — local MP4 vignettes (place your recorded clips here)
- `assets/` — poster images and other static assets

Getting started (macOS / Linux / Windows WSL):

1. Serve the folder with a simple static server (Node.js):

   ```bash
   npx serve .
   # then open http://localhost:3000 in your browser
   ```

2. Or use Python 3 built-in server:

   ```bash
   python3 -m http.server 8000
   # then open http://localhost:8000
   ```

Notes:
- This project is intentionally static and offline. Do not add network requests.
- Before pushing to a remote, verify video filenames and `vignettes.js` configuration.

Next steps:
- Add or verify demo videos in `videos/`.
- Test playback and drawer behavior in `index.html`.
- Create a remote GitHub repository and push the `main` branch when ready.

Metadata:
- Author: Anthony Gould
- Repo: https://github.com/Agould15/wgw-r4-demo-shell
- Created: 2026-09-26

License
-------
This project is provided under the MIT License. See LICENSE for details.

# WGW R4 Demo Shell

Starter package for the local pre-recorded demo experience.

## Included
- `index.html` — demo shell
- `styles.css` — Nextspace-inspired visual treatment
- `vignettes.js` — vignette manifest
- `app.js` — playback and drawer logic
- `WGW_R4_Demo_Target_v4.md` — target story and talk track
- `UI_SPEC.md` — UX requirements
- `CODEX_PROJECT_BRIEF.md` — ready-to-use Codex project brief
- `assets/posters/` — current Nextspace screenshots
- `videos/` — drop final MP4 clips here

## Quick start
Open `index.html` directly, or run:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

The current posters let you demonstrate the intended UI before final videos exist.

## Git
```bash
git init
git add .
git commit -m "Initial WGW R4 demo shell"
```

Keep the repository private/internal as appropriate for the project.
