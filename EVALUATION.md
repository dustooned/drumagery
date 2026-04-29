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
