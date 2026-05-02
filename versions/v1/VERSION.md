# Version v1

Status: in progress

Started: 2026-04-27

## Goal

Calibrate the MIDI layer for the Arturia MiniLab MkII while keeping the v0 fallbacks intact.

## First Change

Moved provisional MIDI assumptions into:

```text
src/input/midiMap.ts
```

This keeps MiniLab note, pad, knob, and strip mapping decisions in one place.

## Calibration UI

Added a recent-message MIDI monitor and learned CC readout to the debug panel. Use it to capture note and CC values before freezing the explicit MiniLab map.

## Hardening Pass

Added resettable MIDI CC learning, replaced stale queue display with `last burst`, and throttled debug panel repainting during MIDI-heavy input.

## Performance-Control Pass

Expanded v1 from calibration-only toward live art performance controls:
- intensity
- bloom
- distortion
- syncTear
- feedback
- noise
- density
- contrast
- chaos
- scale
- fade
- hue
- speed
- pixelate
- burstPower

Learned MIDI CCs map to those controls in that order for the current session.

## Input-Feel Pass

Centralized FX parameter config in `src/state/fxConfig.ts`, added renderer-side parameter smoothing, added `Kill Loops`, and made burst transitions respond to input velocity.

## Visual-Response Config Pass

Added `src/visuals/visualConfig.ts` so art response intensity can be tuned separately from the `0-1` controller values in `src/state/fxConfig.ts`.

## Calibration Slot Pass

Updated the MIDI calibration readout so learned CCs appear as ordered performance-control slots. Empty slots stay visible until the matching knob has been learned.

## Effector Expansion Pass

Added master-doc effectors for bloom, feedback, noise, contrast, and chaos. Added `pixelate` as a whole-stage Pixi filter parameter, using Pixi's built-in filter system without adding a new package.

## Controller-Layout Pass

Split MIDI control learning into knob, strip, and secondary groups. The primary knob bank now learns image-effect controls first, while `speed` and `hue` are reserved for touch strips/sliders.

## Sync-Tear Pass

Added `syncTear` as a whole-stage Pixi filter for sawtooth analog-TV tearing. The primary knob bank is now `intensity`, `bloom`, `distortion`, `syncTear`, `feedback`, `noise`, `contrast`, and `chaos`; `density` moved to secondary controls.

## GitHub Pages Deployment Pass

Published the current app through GitHub Pages at:

```text
https://dustooned.github.io/drumagery/
```

The working Pages source is `main / docs`. The earlier `main / root` path was incorrect for Vite because it served raw source instead of the compiled app. A custom Actions workflow was removed after failing at Pages configuration, and `npm.cmd run build:pages` now generates the committed `docs` deployment output. `public/.nojekyll` is included so Vite restores `docs/.nojekyll` after each Pages build.

## Debug/Performance UI Pass

Added a stage-level `Hide controls` / `Show controls` button. It hides the debug panel for performance or projector use while leaving the panel mounted so MIDI monitoring, state readouts, touch, keyboard, and debug inputs continue to work.

## Expanded Range / Analog Touch Pass

Raised all FX maximum input values to 3x their original maxima while preserving existing defaults. Most controls now run `0..3`; `speed` runs `0.2..6`. Stage touch input now supports continuous sliding for `hue`, `intensity`, and movement-driven `distortion`, plus two-finger spread for `scale`.

## Overdrive / Retro Shell Pass

Values above `1` now push procedural visuals into overdrive instead of only extending the slider range. The app shell is styled as a retro desktop/browser window around the Pixi stage, giving the prototype a computer-desktop performance interface without changing the renderer or input architecture.

## Chroma Split Pass

Added `chromaShift` as a new global FX control and secondary MIDI/manual slot. `src/visuals/ChromaSplitFilter.ts` performs whole-stage RGB channel separation with subtle band wobble, stacked after sync tear and before pixelation.

## Current Validation

```powershell
npm.cmd run build
```

Result: pass.

Latest review: 2026-04-27, no new version snapshot created.

## Run Note

Run through the Vite dev server:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:5173
```

Direct `index.html` loading is not supported for this TypeScript/Vite app.

## Not Yet Frozen

No v1 source snapshot has been created yet. Freeze v1 only after the actual MiniLab mappings are confirmed and behavior is stable.
