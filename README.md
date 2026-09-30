# What Gets Wet — Context in Action

Portable playback shell for the WGW R4 demo. The presenters carry the story; the local vignettes provide visual support.

## Conference playback

The presentation package is designed to run offline from `file://` without a server, Node, npm, or internet access. Once a complete package is available, unzip it and open `index.html` in Chrome or Edge. See `README_OFFLINE.txt` inside the package.

## Local development

Open `index.html` directly in a browser to check the offline experience. A small local server is also available for development and large video byte-range playback:

```bash
python3 scripts/serve.py
```

Then open <http://127.0.0.1:8000/>. The server is optional and is not part of the conference run path.

## Vignettes and media

The launcher is configured in `vignettes.js` to match the V5 story:

1. What might happen?
2. What else is affected?
3. Can the system explain why?
4. What does AQ know? (optional)
5. Can the context be reused?
6. What changed over time?
7. What is inside the building?
8. What could we change? (future)

Place edited, final 1920×1080, 30 fps MP4 exports in `videos/` using the filenames in `vignettes.js`. Working `.mov` recordings are kept out of portable packages. Missing exports show their local poster and a subtle “Video not loaded yet” message.

## Build an offline package

The packaging script includes only the player, local posters, presentation notes, and expected final MP4s. It never copies source recordings, browser profiles, credentials, or development dependencies.

```bash
python3 scripts/package_offline.py --draft
```

This creates `dist/WGW_R4_Demo_Offline_v1_DRAFT.zip` while final clips are missing. A final package is created only when all eight MP4s are present:

```bash
python3 scripts/package_offline.py
```

The final archive is `dist/WGW_R4_Demo_Offline_v1.zip`; its SHA-256 is written beside it. The script exits with a list of missing exports instead of naming an incomplete package as final.

## Capture and editing

See [the V5 Filmmaker + Cast Guide](WGW_R4_Demo_Filmmaker_Cast_Guide_v5.md), [capture brief v2](agents/WGW_R4_Nextspace_Animation_Capture_AGENTS_v2.md). Capture UI-specific instructions must be checked against the current Nextspace environment and labeled New UI, Old UI, or Available in Both. Manual screen recording is appropriate when automation is not verified.

Hydro time-step source captures belong in `agents/captures/` with original lossless frames and a manifest. Keep source frames and working recordings outside the portable conference package.

## Current media status

The working folder currently contains poster art and source `.mov` recordings, but not all eight final named MP4 exports. The offline package can be previewed as a draft; it must not be described as the completed portable conference build until all exports are present and the package has been opened from a different folder path without a server.
