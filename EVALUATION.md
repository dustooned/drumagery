# Evaluation Notes

## v0 Evaluation

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

## Confirmed Working

- Vite dev server runs at `http://localhost:5173`.
- GitHub Pages serves the deployed app at `https://dustooned.github.io/drumagery/`.
- PixiJS stage renders.
- Debug panel can trigger loops and bursts.
- Keyboard fallback controls work.
- Touch fallback controls are implemented for iPad path.
- Web MIDI request is available in desktop browser contexts.
- MIDI permission denial was correctly surfaced in the debug panel.
- Normal desktop browser access resolved the MIDI permission issue.

## Known Gaps

- Arturia MiniLab MkII mappings are still provisional.
- Current MIDI map assumes note `48-51` for loops and pad notes `36-39` for bursts.
- CC mapping currently learns unique CC controls dynamically in `src/input/midiMap.ts` order.
- Touch strips and remaining knobs are not mapped yet.
- Visuals are placeholders, not final instrument identities.
- No dedicated projector layout testing yet.

## v1 Evaluation Target

Before v1 is considered stable:
- Confirm exact MiniLab note numbers for keys and pads.
- Confirm exact CC numbers for knobs and strips.
- Capture recent MIDI monitor output for each controller section.
- Replace dynamic CC learning with an explicit map.
- Keep keyboard/touch/debug parity intact.
- Build must pass.

## v1 Review Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Reviewed current v1 scope:
- MIDI calibration UI is present.
- Recent MIDI message history is present.
- Learned CC display is present.
- Dedicated MIDI mapping file exists at `src/input/midiMap.ts`.
- v0 source snapshot remains unchanged at `versions/v0/source`.
- No new version snapshot was created.

User-facing clarification:
- The app must be opened through Vite at `http://localhost:5173`.
- Direct `index.html` loading is not supported because the browser cannot run the TypeScript module entrypoint directly.

Remaining v1 gap:
- Actual MiniLab MkII note/CC values still need to be recorded from hardware and locked into the explicit map.

## v1 Hardening Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Issues addressed:
- MIDI CC role lookup no longer hides learning inside a read-style helper.
- Added `Clear MIDI Learn` so accidental CC learning can be reset during calibration.
- Replaced stale `queued bursts` debug readout with `last burst`.
- Throttled debug-panel rendering for MIDI-heavy event streams.

Browser sanity check:
- `Visual Instrument V1` panel renders at `http://localhost:5173`.
- `Connect MIDI`, `Clear MIDI Learn`, and `Reset` controls are visible.

Remaining v1 gap:
- Confirm hardware note/CC values and replace provisional/dynamic mapping with explicit MiniLab MkII mappings.

## v1 Performance-Control Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Expanded `globalFX` to the first eight live art-performance controls.
- Added debug sliders for intensity, density, scale, fade, hue, speed, distortion, and burstPower.
- MIDI learned the first eight unique CCs in the same performance-control order at that point in v1.
- Placeholder loops respond to density, scale, fade, hue, speed, distortion, and intensity.
- Burst placeholders respond to density, fade, speed, intensity, and burstPower.

Browser sanity check:
- Expanded controls render at `http://localhost:5173`.

Evaluation focus:
- Controller is not being treated as music input. MIDI is only the physical performance surface.
- Next test should judge whether each knob range feels expressive and controllable during live visuals.

## v1 Input-Feel Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Centralized FX parameter defaults, min/max ranges, slider steps, and smoothing in `src/state/fxConfig.ts`.
- Debug sliders, state normalization, MIDI scaling, and visual smoothing now read from the same FX config.
- Added renderer-side parameter smoothing so visual changes glide toward target values.
- Added `Kill Loops`, which clears active loops and queued bursts without resetting performance controls.
- Added `Backspace` keyboard shortcut for `Kill Loops`.
- Burst animation now uses velocity-dependent attack and decay so soft/hard hits transition differently.

Browser sanity check:
- `Kill Loops` button is visible.
- Clicking loop `1 Ink`, then `Kill Loops`, returns loops to `none`.

Remaining test focus:
- Judge whether current smoothing values feel responsive enough for live control.
- Judge whether burst attack/decay ranges feel musical as a visual gesture.

## v1 Visual-Response Config Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Added `src/visuals/visualConfig.ts` as the central art-response tuning document.
- Moved loop response strength into visual config for ink, symbols, bands, and orbit.
- Moved burst lifetime, attack, force, alpha, detail, and distortion response into visual config.
- Moved background brightness, wash alpha, grid alpha, and grid spacing response into visual config.

Design distinction:
- `src/state/fxConfig.ts` controls the `0-1` effector/control values.
- `src/visuals/visualConfig.ts` controls how strongly the art reacts to those values.

Browser sanity check:
- App renders at `http://localhost:5173` after the config extraction.

## v1 Calibration Slot Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- MIDI learned CC readout now shows all performance-control slots in order.
- Empty slots stay visible as `empty`, making skipped or misordered knob learning easier to catch during hardware calibration.

Scope note:
- No routing changes were made. MIDI still enters through `MidiInput`, dispatches through `InputRouter`, and updates state through `StateEngine`.

## v1 Effector Expansion Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Added master-doc effectors: bloom, feedback, noise, contrast, and chaos.
- Added `pixelate` as a whole-stage Pixi filter parameter.
- Kept all effector values in `globalFX`, with debug sliders and MIDI learning still generated from `src/state/fxConfig.ts` and `src/input/midiMap.ts`.
- Implemented pixelation with Pixi's existing filter system, not a new dependency.

Scope note:
- `bloom` is currently an art-response approximation, not a true blur/bloom post-process.
- `feedback` currently lengthens visual persistence/decay, not a full framebuffer feedback loop.

## v1 Controller-Layout Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Split MIDI learn roles into knob, strip, and secondary groups in `src/input/midiMap.ts`.
- Reserved `speed` and `hue` for strip/slider calibration instead of the primary knob bank.
- Updated the MIDI calibration readout to show grouped learn slots.

Scope note:
- This does not identify hardware strips automatically yet. The current session still learns CCs in order, so calibration should turn knobs first, then strips.

## v1 Sync-Tear Pass

Date: 2026-04-27

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Added `syncTear` to `globalFX` and the debug/MIDI control config.
- Added `src/visuals/SyncTearFilter.ts` as a whole-stage Pixi filter.
- The filter applies horizontal sawtooth band offsets, scanline darkening, and noise-assisted analog tearing.
- Updated the primary knob bank to `intensity`, `bloom`, `distortion`, `syncTear`, `feedback`, `noise`, `contrast`, and `chaos`.
- Moved `density` to the secondary calibration group.

Scope note:
- This is a lightweight CRT tear pass, not a full CRT suite yet. Scanline, roll, chromatic split, and curvature can be separate controls later if needed.

## GitHub Pages Deployment Evaluation

Date: 2026-04-29

Local builds:

```powershell
npm.cmd run build
npm.cmd run build:pages
```

Result: pass.

Live URL check:

```text
https://dustooned.github.io/drumagery/
```

Result: HTTP 200 after GitHub Pages was set to `Deploy from a branch`, `main`, `/docs`.

Issue:
- GitHub Pages was initially disabled or pointed at `main / root`, causing the preview URL to return 404.
- Serving `main / root` is wrong for this Vite + TypeScript project because Pages would host source files rather than the built static app.
- A custom GitHub Actions Pages workflow failed at `Configure GitHub Pages` while the repository was not configured to use Actions as its Pages source.

Resolution:
- Switched to a branch-based Pages deployment.
- Added `build:pages` to generate the Vite build into `docs`.
- Committed `docs/index.html`, `docs/assets`, and `docs/.nojekyll`.
- Added `public/.nojekyll` because Vite clears `docs` before rebuilding and then copies public assets into the output folder.
- Removed the failing custom Pages workflow.

Current deploy rule:
- Keep `vite.config.ts` base set to `/drumagery/`.
- For deploy updates, run `npm.cmd run build:pages`, commit the changed `docs` output, and push to `main`.

## v1 Debug/Performance UI Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- Existing in-app browser tab at `http://localhost:5173/drumagery/` was reloaded.
- `Hide controls` button was present.
- Clicking it hid `#debug-panel`.
- `Show controls` button restored `#debug-panel`.

Implemented:
- Added a fixed stage-level debug toggle in `index.html` and `src/main.ts`.
- Added `.is-debug-hidden` CSS state so performance mode removes the panel from pointer interaction.
- Left the debug panel mounted so MIDI, keyboard, touch, and state updates continue while the panel is hidden.

## v1 Expanded Range / Analog Touch Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- Existing in-app browser tab at `http://localhost:5173/drumagery/` was reloaded.
- `input[data-fx="intensity"]` reports max `3`.
- `input[data-fx="speed"]` reports max `6`.

Implemented:
- Tripled all FX max input ranges in `src/state/fxConfig.ts`.
- Updated whole-stage `pixelate` and `syncTear` filters so values above `1` are not immediately clamped away.
- Added continuous pointer movement handling in `src/input/TouchInput.ts`.
- One-finger stage sliding now routes smooth `hue`, `intensity`, and movement-driven `distortion` through `InputRouter`.
- Two-finger stage spread now routes smooth `scale` through `InputRouter`.
- Range inputs now allow horizontal touch sliding with `touch-action: pan-x`.

## v1 Overdrive / Retro Shell Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- Existing in-app browser tab at `http://localhost:5173/drumagery/` was reloaded.
- `#stage canvas` is visible.
- `#debug-panel` is visible.
- `Hide controls` is present.

Implemented:
- Added overdrive response shaping for FX values above `1`.
- `VisualEngine` now uses overdrive for scanline/noise/grid/wash intensity.
- `LoopLayer` now uses overdrive for density, scale, line weight, and distortion reach.
- `BurstPool` now uses overdrive for burst force, line weight, detail, and alpha.
- Restyled the page as a retro desktop/browser-window shell around the Pixi stage.

Scope note:
- This is an XP-adjacent CSS skin, not an exact operating-system clone. It keeps the app dependency-free and projector/touch compatible.

## v1 Chroma Split Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- Existing in-app browser tab at `http://localhost:5173/drumagery/` was reloaded.
- `input[data-fx="chromaShift"]` is visible.
- `input[data-fx="chromaShift"]` reports max `3`.
- `#stage canvas` is visible.

Implemented:
- Added `chromaShift` to `GlobalFXState`.
- Added `Chroma` control config in `src/state/fxConfig.ts`.
- Added `chromaShift` to secondary MIDI/manual controls without changing the primary eight-knob learn order.
- Added `src/visuals/ChromaSplitFilter.ts`.
- Stacked chromatic split after `SyncTearFilter` and before `PixelateFilter`.

## v1 Vertical Roll Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- Existing in-app browser tab at `http://localhost:5173/drumagery/` was reloaded.
- `input[data-fx="verticalRoll"]` is visible.
- `input[data-fx="verticalRoll"]` reports max `3`.
- `#stage canvas` is visible.

Implemented:
- Added `verticalRoll` to `GlobalFXState`.
- Added `V Roll` control config in `src/state/fxConfig.ts`.
- Added `verticalRoll` to secondary MIDI/manual controls without changing the primary eight-knob learn order.
- Added `src/visuals/VerticalRollFilter.ts`.
- Stacked vertical roll after `SyncTearFilter` and before `ChromaSplitFilter`.

## v1 Phosphor Trail Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- Existing in-app browser tab at `http://localhost:5173/drumagery/` was reloaded.
- `input[data-fx="phosphorTrail"]` is visible.
- `input[data-fx="phosphorTrail"]` reports max `3`.
- `#stage canvas` is visible.

Implemented:
- Added `phosphorTrail` to `GlobalFXState`.
- Added `Phosphor` control config in `src/state/fxConfig.ts`.
- Added `phosphorTrail` to secondary MIDI/manual controls without changing the primary eight-knob learn order.
- Added `src/visuals/PhosphorTrailLayer.ts`.
- The trail layer captures burst ghosts, draws active-loop afterimages, and paints moving scanline trails behind live visuals.
- This is a procedural persistence approximation, not a framebuffer feedback pass.

## v1 Hard Sync Bands Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- Existing in-app browser tab at `http://localhost:5173/drumagery/` was reloaded.
- `input[data-fx="syncBands"]` is visible.
- `input[data-fx="syncBands"]` reports max `3`.
- `#stage canvas` is visible.

Implemented:
- Added `syncBands` to `GlobalFXState`.
- Added `Sync Bands` control config in `src/state/fxConfig.ts`.
- Added `syncBands` to secondary MIDI/manual controls without changing the primary eight-knob learn order.
- Added `src/visuals/HardSyncBandsFilter.ts`.
- Stacked hard sync bands after vertical roll and before chromatic split.

## v1 Documentation Handoff

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Updated:
- `README.md`
- `HANDOFF.md`
- `PROTOTYPE_V1.md`
- `versions/README.md`
- `versions/v1/VERSION.md`

Next recommended implementation:
- Add image-sequence infrastructure for major-key toggles.
- Keep minor-key/pad visuals procedural/vector-based.
- Preserve iPad/touch fallback and the `InputRouter -> StateEngine -> VisualEngine` architecture.

## v1 Image-Sequence Infrastructure Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Added `src/visuals/imageSequenceManifest.ts` as the source of truth for major-key persistent loop slots.
- Added `src/visuals/ImageSequenceLoopLayer.ts` for future frame-path playback.
- Empty `framePaths` are safe: the image-sequence layer draws procedural placeholders instead of requiring external assets.
- `StateEngine` tags major loop state with the matching image-sequence slot ID while keeping inputs routed through `InputRouter`.
- Minor-key/pad burst visuals remain procedural and pooled in `BurstPool`.

Scope note:
- This pass creates the infrastructure only. Real sequence assets, final major-key visual identity, and per-slot timing/anchor tuning are still open.

## v1 MIDI Role / Debug Spacing Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- In-app browser at `http://localhost:5173/drumagery/` was reloaded.
- Debug panel shows `Major image loops`.
- Debug panel shows `Minor vector bursts`.
- `Connect MIDI` is visible after the bottom-spacing adjustment.
- No browser console errors were reported.

Implemented:
- Renamed MIDI note mapping fields so major notes explicitly map to sequence loop toggles.
- Renamed MIDI pad/minor-note mapping fields so they explicitly map to procedural vector bursts.
- Adjusted debug panel bottom spacing and sticky action-row padding so the MIDI action buttons are not cramped against the footer.

## v1 Stage Actions / Fullscreen Layout Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- In-app browser at `http://localhost:5173/drumagery/` was loaded.
- `#stage canvas` is visible.
- `#stage-actions` is visible.
- `Connect MIDI`, `Clear MIDI Learn`, `Kill Loops`, `Reset`, and `Fullscreen` are present in the stage action bar.
- The debug panel no longer contains the MIDI action buttons.
- No browser console errors were reported.

Implemented:
- Moved MIDI/action buttons out of the scrolling debug panel and below the visual window.
- Changed the main layout so the visual stage and debug panel do not overlap on desktop-sized viewports.
- Added a `Fullscreen` button that requests fullscreen on the visual stage and changes to `Exit fullscreen` while active.

## v1 Fullscreen Canvas Fill Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- In-app browser at `http://localhost:5173/drumagery/` was loaded.
- `#stage canvas` is visible.
- `#fullscreen-toggle` exists in the stage action bar.
- `#fullscreen-exit` exists inside the stage for fullscreen exit control.
- No browser console errors were reported.

Implemented:
- Fullscreen stage mode now removes the faux window title/status chrome.
- Fullscreen stage mode removes canvas borders and padding so the Pixi canvas fills the fullscreen viewport.
- Added an in-stage corner `Exit` button that appears during fullscreen and calls `document.exitFullscreen()`.

## v1 Fullscreen Cover Scaling Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Browser sanity check:
- In-app browser at `http://localhost:5173/drumagery/` was loaded.
- `#stage canvas` is visible.
- `#fullscreen-toggle` exists.
- `#fullscreen-exit` exists.
- No browser console errors were reported.

Implemented:
- Added a Pixi scene root so the 1280 x 720 internal visual coordinate system can scale independently from the renderer size.
- Added renderer resizing based on the actual canvas `getBoundingClientRect()` dimensions.
- Scales the 1280 x 720 scene with cover-fit math, filling the detected canvas/hardware size instead of leaving black bands.
- Re-runs the resize pass on browser resize and fullscreen changes.

## v1 Phase 0 Stabilization Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Updated `VisualEngine` so the Pixi filter area follows the actual presentation canvas size after resize/fullscreen changes instead of staying locked to 1280x720.
- Added `MIDI_ZERO_DEADZONE = 0.02` after MIDI CC normalization and before FX state updates.
- MIDI debug now preserves raw CC value, normalized value, post-deadzone value, and learned role.

## v1 Temporal Grid Prototype Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Extended `src/visuals/ImageSequenceLoopLayer.ts` with a first-pass temporal grid for major-key loops.
- `density` selects 1x1, 2x2, 4x4, 6x6, or 8x8 grids, with mobile/touch-sized screens capped at 6x6.
- `speed` advances global frames, `chaos` creates per-tile temporal offsets, and `distortion` adds simple tile jitter/spread.
- Empty `framePaths` remain safe and render tiled procedural placeholders instead of requiring assets.

Scope note:
- This is the Phase 1 cascade-style prototype only. Uniform, wave, and deterministic randomized modes are still separate Phase 2 work.

## v1 Temporal Mode Expansion Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Added per-slot temporal modes in `src/visuals/imageSequenceManifest.ts`.
- Major 1 uses `uniform`, Major 2 uses `cascade`, Major 3 uses `wave`, and Major 4 uses deterministic `randomized`.
- `ImageSequenceLoopLayer` now calculates tile frame offsets by mode while keeping `chaos` as the offset strength.
- Randomized mode uses seeded tile values, not new random values each frame, so it should not flicker.

Scope note:
- Modes are assigned per major slot for this pass. A performance UI selector can be added later if live mode switching becomes useful.

## v1 Screensaver Node Scaffold Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Added `activeScreensaverNodes` to instrument state.
- Burst events now keep triggering the existing pooled `BurstPool` and also wake a bounded procedural screensaver node through `StateEngine`.
- Added `src/visuals/ScreensaverNodeLayer.ts` with `bouncing-shape` and `starfield` node renderers.
- Wired the node layer into `VisualEngine` without direct MIDI access or direct input-to-visual binding.
- Added active node names to the debug live-state readout.

Scope note:
- This is a scaffold only. Burst behavior is still intact, and pads remain the trigger source for short burst hits plus node wake/pulse behavior.

## v1 Input Role Split Correction

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Split provisional MIDI note roles in `src/input/midiMap.ts`.
- White-key notes `[48, 50, 52, 53]` now toggle major image-sequence loops.
- Black-key notes `[49, 51, 54, 56]` now start procedural Screensaver Node holds.
- Held screensavers get a sine-like alpha/scale pulse while the note is down.
- Black-key note-off events release screensavers into eased fade-outs.
- Drum-pad notes `[36, 37, 38, 39]` now trigger pooled bursts only and no longer activate screensaver nodes.

Scope note:
- Exact hardware note numbers are still provisional until MiniLab calibration is confirmed in desktop Chrome or Edge.

## v1 Performance Edge Dock Pass

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Implemented:
- Added `src/ui/PerformanceEdgeDock.ts`.
- Added `src/ui/performanceDockConfig.ts`.
- Added a bottom-corner touch overlay with `GRID`, `TV`, `PLAY`, and `FX` panels inside the visual stage.
- GRID exposes density, chaos, and distortion controls.
- TV exposes chroma, vertical roll, sync tear, sync bands, pixelate, and phosphor controls.
- PLAY exposes loop toggles, burst triggers, Kill Loops, Reset, burst power, and fade.
- FX exposes intensity, speed, scale, feedback, bloom, noise, and contrast.
- Dock controls dispatch through `InputRouter` and do not manipulate Pixi visuals directly.
- The dock appears only in stage fullscreen mode, matching the in-stage Exit control instead of duplicating the main debug menu.
- A quick `Reset` button appears beside the dock menu after a dock action changes performance state, remains visible across submenus, then disappears after reset.
- The dock root uses pointer-safe behavior so the stage remains playable outside visible controls.

Scope note:
- This is the first Edge Dock scaffold. Layout and category contents should be tuned after touch-device testing.

## v1.1 Light Documentation Update

Date: 2026-05-02

Build:

```powershell
npm.cmd run build
```

Result: pass.

Updated:
- Removed the root `NEXT_CHAT_PROMPT.md` artifact.
- Kept the checkpoint inside active v1 as a small v1.1 documentation/update note, not a new major version.
- Updated `README.md`, `HANDOFF.md`, `PROTOTYPE_V1.md`, `versions/README.md`, and `versions/v1/VERSION.md` so continuation context lives in the normal project docs.

## v1 Event-Readiness Touch / Sequence Pass

Purpose:
- Prepare the project for near-term iPad/event testing by reducing touch-control chaos and enlarging the playable grid without depending on Web MIDI or new assets.

Implemented:
- Added a temporary `Big grid` button and mobile-stage mode.
- `Big grid` hides debug/action clutter, enlarges the Pixi stage, and keeps in-stage `Exit` plus the Performance Edge Dock `Menu` available.
- Removed touch-driven continuous global-FX steering from `TouchInput`.
- Touch now routes burst taps, burst-hold start/release, and paired screensaver start/release events through `InputRouter`.
- Added `activeBurstHolds` to state.
- Keyboard and MIDI drum pads now also emit burst hold/release events for desktop testing.
- Held burst rendering now has a 400ms release ease; `Glitch` stretches horizontally while held.
- Expanded loop infrastructure to five named slots: Vaporwave, Chrome Tide, Signal Garden, Glass Desert, and Neon Weather.
- Added 24-frame ping-pong playback scaffolding for image-sequence loops while keeping empty frame lists safe.
- Reverted the single-file animated WebP experiment after Pixi/WebGL failed to produce reliable visible animation. The active path is 24 PNG frames per loop slot.
- Expanded procedural screensaver scaffolds to grid ocean, clouds, sandstorm, rain, wind, starfield, mystify, static, and pulse.

Validation:

```powershell
npm.cmd run build
```

Result: pass.

Remaining risk:
- Needs real iPad Safari testing for touch ergonomics, browser fullscreen behavior, and event-room performance feel.

Scope note:
- This earlier event-readiness pass was superseded by the v1.3 uploaded PNG sequence checkpoint below.

## v1.3 Uploaded PNG Sequence Checkpoint

Date: 2026-05-05

Build:

```powershell
npm.cmd run build
npm.cmd run build:pages
```

Result: pass.

Implemented:
- Wired uploaded PNG frame sequences for Vaporwave, Chrome Tide, Signal Garden, Glass Desert, and Neon Weather.
- Each slot uses frames `00000` through `00023`, keeping the active playback target at 24 frames.
- Left exported `00024` files unused for now so the manifest stays aligned with the requested 24-frame limit.
- Kept the single-file WebP exports as reference assets only; active playback uses PNG frame paths.
- Confirmed `docs/sequences` contains the copied Pages assets after `npm.cmd run build:pages`.

Browser check:
- Opened `http://localhost:5173/drumagery/`.
- Triggered loop keys `1` through `5`.
- Debug state showed all five named loops active.
- Console warnings/errors: 0.

Remaining risk:
- Needs target iPad Safari and projector testing for real performance feel, load time, and touch ergonomics.

## v1.3 Control / Wallpaper Polish

Date: 2026-05-05

Build:

```powershell
npm.cmd run build
npm.cmd run build:pages
```

Result: pass.

Implemented:
- Removed image-loop toggles from canvas touch input so touch does not accidentally change sequence loops.
- Made canvas touch drive burst and screensaver behavior only.
- Reworked the MIDI learn layout around the MiniLab surface: knobs 1-8 analog-TV effectors, knobs 9-16 shape sculpting, and touch sliders for `verticalRoll` and `chromaShift`.
- Added direct handling for Arturia MiniLab MkII channel 1 pitch-bend messages (`command 224`) as `verticalRoll`.
- Increased screensaver node brightness while retaining the 3x vector stroke pass.
- Wired `public/wallpapers/xp-desktop/xp-desktop.png` as the XP-style app desktop background.
- Added emoji/icon labels to the fullscreen Performance Edge Dock without changing routing IDs.
- Added per-slot image-sequence blend modes to make each sequence title feel more specific.
- Added a subtle desktop taskbar with Start popover for version/app/contact information and the dustooned.com link.

Browser check:
- Opened `http://localhost:5173/drumagery/`.
- Verified Big grid dock shows emoji Reset/Menu/category labels.
- Verified top-canvas touch no longer creates active image loops.
- Console warnings/errors: 0.

Remaining risk:
- Needs real MiniLab calibration to confirm the physical knob/slider order matches the intended learned order.
- Needs target iPad/projector testing for wallpaper readability and dock label legibility.
