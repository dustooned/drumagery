# Handoff

## Current Track

The project has moved from saved v0 into v1 MIDI calibration development. No new version snapshot has been created after v0.

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

Current v1 state:
- `src/input/midiMap.ts` owns provisional MIDI assumptions.
- Debug panel title is `Visual Instrument V1`.
- MIDI calibration panel shows recent raw messages.
- MIDI calibration panel shows learned CC assignments.
- Learned CC assignments now render as fixed performance-control slots, so missing or misordered knob learning is easier to spot.
- MIDI learn layout is grouped as knobs first, then strips for `speed` and `hue`, then secondary controls.
- `Clear MIDI Learn` resets accidental CC learning during calibration.
- Debug panel shows `last burst` instead of stale burst queue count.
- MIDI-heavy debug rendering is throttled.
- `globalFX` now includes the master-doc effectors plus pixelation and analog tearing: intensity, bloom, distortion, syncTear, feedback, noise, density, contrast, chaos, scale, fade, hue, speed, pixelate, and burstPower.
- Placeholder visuals respond to the expanded performance controls.
- FX defaults, min/max ranges, slider steps, and smoothing values are centralized in `src/state/fxConfig.ts`.
- Visual response tuning is centralized in `src/visuals/visualConfig.ts`.
- `Kill Loops` clears active loops and queued bursts without resetting current performance controls.
- Burst animation now uses input-dependent attack/decay based on hit velocity.
- Build passes.

Latest v1 pass:
- Added a lightweight whole-stage Pixi pixelation filter controlled by `pixelate`.
- Added procedural responses for bloom, feedback, noise, contrast, and chaos without new dependencies.
- Split MIDI control calibration into knob, strip, and secondary groups in `src/input/midiMap.ts`.
- Added `syncTear` as a whole-stage Pixi filter for sawtooth analog-TV tearing.

Next practical step:
- Use the controller as a performance surface, not a musical-note system.
- Turn the eight knobs first, then the `speed` and `hue` strips, then any secondary controls you want to calibrate.
- Keep notes/pads as loop and burst triggers, but focus evaluation on visual feel.
- Test whether burst attack feels right across soft and hard pad hits.
- Tune `src/visuals/visualConfig.ts` when the knob value is right but the art response is too weak or too strong.

Run through Vite, not by opening `index.html` directly:

```powershell
npm.cmd run dev
```

Then open:

```text
http://localhost:5173
```

## Constraints To Preserve

- iPad Safari must keep working without MIDI.
- Keyboard and touch must remain fallback inputs.
- State remains the single source of truth.
- Bursts stay pooled.
- Loop count stays capped.
- No external assets for the current prototype stage.
