# Handoff

## Current Track

The project has moved from saved v0 into active v1 performance-control development. The current checkpoint is v1.3.5: a reactive burst-mode polish pass that keeps the XP-adjacent desktop/browser shell and Performance Edge Dock, preserves manual FX as the default baseline, adds an opt-in Reactive mode for held/slid burst TV effects, keeps `Big grid` mode, and retains the v1.3 uploaded 24-frame PNG sequence loop slots with procedural fallbacks.

## GitHub Pages Deployment

Live URL:

```text
https://dustooned.github.io/drumagery/
```

Deployment source:

```text
main / docs
```

Issue found:
- `main / root` produced a 404 or broken deploy path because it serves raw Vite/TypeScript source, not the compiled app.
- The custom GitHub Actions workflow failed at `Configure GitHub Pages` while Pages was not configured for Actions.

Resolution:
- Removed the failing Pages workflow.
- Added `npm.cmd run build:pages`, which builds Vite output into `docs`.
- Committed `docs/index.html`, `docs/assets`, and `docs/.nojekyll`.
- Added `public/.nojekyll` so Vite restores `docs/.nojekyll` on every Pages build.
- Confirmed the live Pages URL returns HTTP 200.

When updating the deployed app, run:

```powershell
npm.cmd run build:pages
```

Then commit and push the changed `docs` files.

## v0 Saved State

Saved at:

```text
versions/v0
```

v0 includes the Vite + TypeScript + PixiJS scaffold, InputRouter, state system, keyboard/touch/debug inputs, optional MIDI input, raw MIDI debug readout, and placeholder loop/burst visuals.

Validation at checkpoint:

```powershell
npm.cmd run build
```

Result: passing.

## Important MIDI Finding

MIDI detection works when opened in a normal desktop browser. The Codex in-app browser denied Web MIDI permission with:

```text
Permission to use Web MIDI API was not granted.
```

That was a browser permission/environment issue, not an app mapping issue.

Use desktop Chrome or Edge for MIDI testing:

```text
http://localhost:5173
```

Then click `Connect MIDI` in the debug panel.

## v1 Direction

First v1 development goal: make MIDI mapping easy to calibrate for the Arturia MiniLab MkII.

Current v1 build goal: turn the prototype into a functional interactive-concert visual instrument with raw analog visuals, readable controls/data, iPad-safe touch fallback, and image-sequence infrastructure for major-key toggles.

Current v1.3.5 state:
- `src/input/midiMap.ts` owns provisional MIDI assumptions.
- Debug panel title is `Visual Instrument V1`.
- MIDI calibration panel shows recent raw messages.
- MIDI calibration panel shows learned CC assignments.
- Learned CC assignments now render as fixed performance-control slots, so missing or misordered knob learning is easier to spot.
- MIDI learn layout is grouped as knobs 1-8 for analog-TV effectors, knobs 9-16 for shape sculpting, then touch sliders for `verticalRoll` and `chromaShift`. Arturia MiniLab MkII channel 1 pitch-bend messages (`command 224`) map directly to `verticalRoll`.
- `Clear MIDI Learn` resets accidental CC learning during calibration.
- Debug panel shows `last burst` instead of stale burst queue count.
- MIDI-heavy debug rendering is throttled.
- `globalFX` now includes the master-doc effectors plus pixelation and analog tearing: intensity, bloom, distortion, syncTear, feedback, noise, density, contrast, chaos, scale, fade, hue, speed, pixelate, and burstPower.
- Placeholder visuals respond to the expanded performance controls.
- FX defaults, min/max ranges, slider steps, and smoothing values are centralized in `src/state/fxConfig.ts`.
- Visual response tuning is centralized in `src/visuals/visualConfig.ts`.
- Five major-key loop sequence slots are centralized in `src/visuals/imageSequenceManifest.ts`.
- `src/visuals/ImageSequenceLoopLayer.ts` renders image-sequence slots as temporal grids from PNG frame lists or safe procedural placeholders.
- MIDI note routing is explicit: white-key notes toggle sequence loops, black-key notes hold/release procedural Screensaver Nodes, and drum-pad notes trigger pooled procedural/vector bursts with hold/release state.
- `src/visuals/ScreensaverNodeLayer.ts` owns lightweight procedural nodes for grid ocean, clouds, sandstorm, rain, wind, starfield, mystify, static, and pulse.
- `src/ui/PerformanceEdgeDock.ts` owns the fullscreen-stage bottom-corner GRID/TV/PLAY/FX overlay and dispatches through `InputRouter`.
- `Kill Loops` clears active loops and queued bursts without resetting current performance controls.
- Burst animation now uses input-dependent attack/decay based on hit velocity.
- FX max input ranges are expanded to 3x the original max values. Most controls are now `0..3`; `speed` is now `0.2..6`.
- Values above `1` now create visible overdrive in the procedural visuals and whole-stage filters.
- Touch is intentionally simplified for the event: stage taps/holds trigger burst holds and paired screensaver accents; touch no longer directly steers `hue`, `intensity`, `distortion`, or `scale`.
- Reactive mode is opt-in and off by default. When enabled, held/slid burst gestures temporarily add burst-specific TV effects over the user's manual `globalFX` baseline, then fade back on release. Manual settings remain steady until the user changes them or presses Reset.
- The app has a retro desktop/browser-window shell around the Pixi canvas, styled in a Windows XP-adjacent direction without adding dependencies.
- The stage and debug panel now use a non-overlapping layout, with MIDI/action buttons below the visual window.
- `chromaShift` adds a whole-stage RGB split/glitch color offset through `src/visuals/ChromaSplitFilter.ts`.
- `verticalRoll` adds whole-stage old-TV tracking drift through `src/visuals/VerticalRollFilter.ts`.
- `phosphorTrail` adds lightweight procedural persistence through `src/visuals/PhosphorTrailLayer.ts`.
- `syncBands` adds hard blocky horizontal sync jumps through `src/visuals/HardSyncBandsFilter.ts`.
- Build passes.

Latest v1 pass:
- Added Pixi renderer resizing and cover-fit scene scaling so the 1280 x 720 visual system fills the detected canvas/hardware size in fullscreen.
- Updated fullscreen mode so the Pixi canvas fills the fullscreen viewport without the faux browser title/status chrome.
- Added an in-stage corner `Exit` button for returning from fullscreen to the regular interface.
- Moved `Connect MIDI`, `Clear MIDI Learn`, `Kill Loops`, `Reset`, and `Fullscreen` into a stage action bar below the visual window.
- Added fullscreen toggle behavior for the visual stage.
- Changed the app shell so the 1280x720 stage does not sit underneath the debug menu on desktop-sized viewports.

Latest event-readiness pass:
- Added `Big grid` as a temporary iPad-safe performance mode. It hides debug/action clutter, enlarges the stage, and keeps in-stage `Exit` plus the Performance Edge Dock `Menu` available.
- Added `activeBurstHolds` to state. Touch, keyboard, and MIDI drum-pad input now route hold start/release events through `InputRouter`.
- Updated held burst rendering so `Glitch` stretches horizontally while the other burst pads use matching impact/hold/release envelopes.
- Expanded loop slots to five named categories: Vaporwave, Chrome Tide, Signal Garden, Glass Desert, and Neon Weather.
- Added 24-frame ping-pong playback scaffolding for image-sequence loops while keeping empty manifests asset-free and procedural.
- Reverted the experimental single-file animated WebP path. The active asset path is now 24 PNG frames per loop slot.
- Wired uploaded PNG sequences for Vaporwave, Chrome Tide, Signal Garden, Glass Desert, and Neon Weather. Each slot uses frames `00000` through `00023`; exported `00024` files are intentionally left unused while the active target stays at 24 frames.
- Expanded procedural screensaver node scaffolds to the requested lightweight categories without adding shaders or dependencies.
- Clarified the MIDI note role split in `src/input/midiMap.ts`: major sequence notes vs minor vector burst notes.
- Updated the debug panel headings to `Major image loops` and `Minor vector bursts`.
- Raised the debug panel bottom gap and sticky action-row padding so `Connect MIDI` is easier to see near the footer.
- Added image-sequence infrastructure for major-key loop toggles without requiring real external assets.
- Added `src/visuals/imageSequenceManifest.ts` as the source of truth for major-key sequence slots.
- Added `src/visuals/ImageSequenceLoopLayer.ts`, which can animate provided frame paths later and draws a safe procedural placeholder now.
- `StateEngine` now tags toggled major loops with their image-sequence slot ID while preserving the `InputRouter -> StateEngine -> VisualEngine` path.
- Minor-key/pad burst visuals remain procedural and pooled in `BurstPool`.
- Added `syncBands` as a hard sync / block jump effector.
- Added `src/visuals/HardSyncBandsFilter.ts` and stacked it before chromatic split in `VisualEngine`.
- Added `phosphorTrail` as a lightweight old-screen persistence layer.
- Added `src/visuals/PhosphorTrailLayer.ts` for burst ghosts, loop afterimages, and scanline trails.
- Added `verticalRoll` as the second named retro-TV effector after chromatic split.
- Added `src/visuals/VerticalRollFilter.ts` and stacked it between sync tear and chromatic split in `VisualEngine`.
- Added `chromaShift` as the first named retro-TV effector after sync tear.
- Added `src/visuals/ChromaSplitFilter.ts` and stacked it between sync tear and pixelate in `VisualEngine`.
- Added overdrive response shaping for the expanded `1..3` control range.
- Restyled the stage and debug panel as a classic desktop/browser-window interface.
- Expanded FX control max input values to 3x.
- Added analog touch sliding on the stage while keeping tap zones for loops and bursts.
- Refined the debug/performance menu into clearer live-state, loop, burst, analog-TV knob, shape-sculpt knob, touch-slider, manual-extra, and MIDI sections.
- Added `Hide controls` / `Show controls` so touch, MIDI, and the full visual stage can coexist during performance or projector use.
- Added a lightweight whole-stage Pixi pixelation filter controlled by `pixelate`.
- Added procedural responses for bloom, feedback, noise, contrast, and chaos without new dependencies.
- Split MIDI control calibration into knob, strip, and secondary groups in `src/input/midiMap.ts`.
- Added `syncTear` as a whole-stage Pixi filter for sawtooth analog-TV tearing.

v1.1 light update:
- Removed the separate root next-chat prompt artifact. Continuation notes now live in the project docs.
- Keep this as a small update within active v1, not a new major version.

v1.3 checkpoint:
- Added `versions/v1.3/VERSION.md` as the checkpoint note for the uploaded PNG-sequence pass.
- Built five active major-key PNG loops from `public/sequences`: Vaporwave, Chrome Tide, Signal Garden, Glass Desert, and Neon Weather.
- Kept playback at 24 frames per slot by using frames `00000` through `00023`; exported `00024` files remain unused.
- Verified local browser playback at `http://localhost:5173/drumagery/` by triggering keys `1` through `5` with no console warnings or errors.
- Added `public/wallpapers/xp-desktop/` as the planned drop path for an XP-style desktop wallpaper. Use a `2560 x 1440` master image.
- Wired `public/wallpapers/xp-desktop/xp-desktop.png` as the live desktop background through a Vite base-aware CSS variable.
- Added emoji/icon display labels to the fullscreen Performance Edge Dock. These are visual labels only; routing still depends on stable `data-*` attributes and state control IDs.
- Removed canvas touch loop toggles; touch now drives burst/screensaver behavior only.
- Mapped Arturia MiniLab MkII channel 1 pitch-bend messages (`command 224`) directly to `verticalRoll`.
- Boosted screensaver brightness and kept thicker vector strokes for stronger stage presence.
- Added per-slot image-sequence blend modes: Vaporwave and Signal Garden use `screen`, Chrome Tide and Neon Weather use `add`, and Glass Desert uses `multiply`.
- Added a subtle XP-style desktop taskbar with a Start popover and a start-button sprite drop path at `public/taskbar/start-button/start-button.png`.
- Updated the taskbar Start popover to fade in/out over `800ms ease`, auto-close after 5 seconds, and close when Start is clicked again.
- Added a taskbar hide/restore control for the default desktop/debug layout, with the hide sprite drop path at `public/taskbar/hide-button/hide-button.png`.
- Taskbar is intentionally hidden in Big grid and fullscreen modes so it does not interfere with performance output.

Next practical step:
- Evaluate temporal grids, black-key screensaver holds, drum-pad bursts, and the Edge Dock on the target iPad/browser before adding the next system.
- Tune per-slot FPS, scale, and anchor after testing the five uploaded loops in the room.
- Tune the XP/browser-window shell after seeing it in the room: decide whether it should read more like a standalone desktop app, a fake web browser, or a projector-safe control surface.
- Continue keeping black-key screensavers and drum-pad burst visuals in the procedural layer.
- Use the controller as a performance surface, not a musical-note system.
- Turn knobs 1-8 first, then knobs 9-16, then the `verticalRoll` and `chromaShift` touch sliders.
- Keep white keys, black keys, and pads as separate performance roles, and focus evaluation on visual feel.
- Test whether drum-pad burst attack feels right separately from black-key screensaver hold/release.
- Tune `src/visuals/visualConfig.ts` when the knob value is right but the art response is too weak or too strong.

Run through Vite, not by opening `index.html` directly:

```powershell
npm.cmd run dev
```

Then open:

```text
http://localhost:5173
```

GitHub Pages/dev-path preview may also be opened at:

```text
http://localhost:5173/drumagery/
```

## Next Chat Starter

```text
Continue in E:\2026\Dev\Experiment\UTH. Current local work after commit a6f687f adds XP taskbar refinements but is not committed yet: Start popover fades 800ms, auto-closes after 5s, taskbar hide/restore button, taskbar hidden in Big grid/fullscreen, and sprite folders under public/taskbar/start-button and public/taskbar/hide-button. Run npm.cmd run build before more edits. Main next work is target iPad/projector testing and MiniLab mapping lock.
```

## Constraints To Preserve

- iPad Safari must keep working without MIDI.
- Keyboard and touch must remain fallback inputs.
- State remains the single source of truth.
- Bursts stay pooled.
- Loop count stays capped.
- No external assets for the current prototype stage.
