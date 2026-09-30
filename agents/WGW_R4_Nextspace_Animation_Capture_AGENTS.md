# Codex Task Brief: WGW R4 Animation Capture

Use this file as the task brief when working with Anthony on the What Gets Wet (WGW) R4 demo vignettes.

## Mission

Build and validate a repeatable way to capture the WGW flood animation one time interval at a time. For every interval, let the Nextspace scene finish rendering, capture a high-quality frame, and save the frames in order so they can be assembled into a time-lapse video.

The intended visual story is floodwater advancing over time and affecting houses/parcels. Keep the camera, map extent, layer styling, legend, and other visible scene elements consistent between frames.

## Known project context

- This is the Anchor QEA “What Gets Wet” flood-modeling and digital-twin pilot.
- Anchor QEA brings flood-modeling and domain expertise; Nextspace provides the ontology-driven digital-twin environment.
- Flood-model outputs are natively NetCDF time series. A representative scenario discussed for the prototype had 461 time steps at six-minute intervals, spanning about 46 hours. Treat these as example figures; inspect the supplied scenario and R4 materials for the actual run.
- Water-surface elevation is the likely primary animation variable. Other available variables may include water depth, velocity, wave height, or arrival time. Do not change the intended variable or scenario without checking the R4 vignette notes or asking Anthony.
- Parcel/building overlays are intended to help explain what gets wet and what is impacted over time.
- Nextspace has a new Operator UI and an older UI with incomplete feature parity. Label any instructions that depend on a particular UI as **New UI**, **Old UI**, or **Available in Both**. Do not assume a workflow exists in both.
- The exact R4 vignette order, narration, scenario, and capture extent are not included in this brief. Search the files and conversation context provided for this task. Do not invent these details.

## Inputs to confirm

Inspect available project files and the live/authorized Nextspace session for the following. Use existing session authentication; never ask Anthony to paste passwords, tokens, cookies, or other secrets into code or chat.

- Nextspace environment and UI: `{{NEXTSPACE_URL_OR_ENVIRONMENT}}`
- R4 vignette / scenario: `{{R4_VIGNETTE_AND_SCENARIO}}`
- Desired map extent and visible layers: `{{MAP_EXTENT_AND_LAYERS}}`
- Capture output folder: `{{OUTPUT_DIRECTORY}}`
- Desired output dimensions / aspect ratio: `{{OUTPUT_RESOLUTION_OR_ASPECT_RATIO}}`
- Whether the deliverable needs only a frame sequence, a video, or both: `{{DELIVERABLES}}`

If a value is not supplied, inspect the available files and session first. Ask a concise question only for details that cannot be established safely from the available evidence.

## Work instructions

1. **Inspect before automating.** Review the R4 vignette materials and project files that are available. Identify the scenario, time-step control, map layers, camera/extent, legend, and any loading or rendering indicators. Determine whether the current environment exposes a usable browser or desktop-control method.
2. **Choose the least brittle control path.** Prefer documented Nextspace controls or accessible UI elements. If browser automation is available, use it with the user's already-authenticated session. Avoid brittle screen-coordinate clicking when a semantic selector, keyboard action, or supported application control is available. Do not bypass authentication, MFA, or access controls.
3. **Do not assume direct access.** If this Codex session cannot see or control Anthony's browser, say so clearly. Continue by preparing a runnable local automation script and setup instructions if the environment supports that approach. Do not claim to have operated Nextspace or captured real frames unless you did.
4. **Advance one interval at a time.** Use the same selected scenario, variable, map view, visible layers, and styling for every frame. Record the timestamp or time-step index associated with each capture.
5. **Wait for the scene to settle.** Use a real app signal when available, such as completion/loading state or completed map query. If none is exposed, use a configurable settling detector that samples the rendered map and waits until it remains visually stable for several consecutive checks, with a sensible minimum wait and a maximum timeout. Network idle alone is not proof that a WebGL map has finished rendering. Log timeouts and do not silently save a visibly incomplete frame.
6. **Capture at source resolution.** Prefer lossless PNG screenshots for discrete time steps. Capture the complete intended composition, including any required legend or context, at the highest practical source resolution. Do not upscale a low-resolution capture and describe it as high fidelity. If using browser screenshots, verify that the map canvas is rendered at the requested pixel dimensions. If using screen recording, configure the recording output to preserve the source resolution.
7. **Pilot before a full run.** Capture a small set of early, middle, and later intervals. Inspect the images for completeness, stable framing, readable labels, and expected flood progression. Confirm the capture settings and output naming with Anthony only if the pilot exposes a material ambiguity; otherwise proceed with the best-supported settings.
8. **Keep provenance.** Save frames in a dedicated output folder with ordered, timestamped filenames. Write a CSV or JSON manifest with scenario, variable, time-step index/time, capture timestamp, image dimensions, settling duration, and any warning or failure. Never overwrite unrelated user files.
9. **Preserve evidence.** Keep the original lossless frames. If producing a compressed video, make it a separate derivative and retain the frame sequence.
10. **Report accurately.** Summarize what was inspected, which UI was used, the capture method, resolution, frame count, any failed or skipped frames, and the exact output paths. Distinguish tested behavior from assumptions.

## Recommended deliverables

- A reusable local script or automation project that advances time and captures frames.
- A short README with setup, authentication/session prerequisites, configuration, run command, and recovery instructions.
- A numbered PNG frame sequence and a manifest, if Nextspace access is available.
- A video assembled from the frames only if requested or clearly useful; retain the original PNGs.

## Completion checks

Before calling the work complete, verify that:

- The pilot frames have matching dimensions and stable framing.
- Each saved frame corresponds to the manifest's recorded time step.
- The map and required overlays are fully rendered, with no loading state or obvious partial tiles.
- The image sequence is ordered correctly and shows the expected change over time.
- The output folder contains no credentials, browser profile data, or unrelated files.
- The final report identifies any limitation that prevents full automation or full-resolution capture.

## Immediate request

Using the R4 vignette materials and the authorized Nextspace environment available for this task, implement and validate the most reliable interval-by-interval capture workflow you can. Start with a small pilot, inspect its frames, then complete the requested capture and handoff instructions.
