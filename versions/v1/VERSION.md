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

## Vertical Roll Pass

Added `verticalRoll` as a new global FX control and secondary MIDI/manual slot. `src/visuals/VerticalRollFilter.ts` performs whole-stage old-TV tracking drift, vertical image slip, and bright tracking-line instability.

## Phosphor Trail Pass

Added `phosphorTrail` as a new global FX control and secondary MIDI/manual slot. `src/visuals/PhosphorTrailLayer.ts` provides lightweight old-screen persistence with burst ghosts, loop afterimages, and moving scanline trails without using framebuffer feedback.

## Hard Sync Bands Pass

Added `syncBands` as a new global FX control and secondary MIDI/manual slot. `src/visuals/HardSyncBandsFilter.ts` performs blocky horizontal band jumps, compression, and bright sync-hit flashes before chromatic split and pixelation.

## Image-Sequence Infrastructure Pass

Added `src/visuals/imageSequenceManifest.ts` as the source of truth for major-key image-sequence loop slots. Added `src/visuals/ImageSequenceLoopLayer.ts` for future frame-path playback, with procedural placeholders when `framePaths` are empty so the app does not require external assets yet. Major-key loop toggles still route through `InputRouter -> StateEngine -> VisualEngine`; minor-key/pad burst visuals remain procedural and pooled.

## MIDI Role / Debug Spacing Pass

Made the major/minor split explicit in `src/input/midiMap.ts`: major notes toggle persistent image-sequence loops and minor/pad notes trigger short-lived procedural vector bursts. Updated debug panel labels to match that split and raised the bottom spacing so `Connect MIDI` is easier to see near the footer.

## Stage Actions / Fullscreen Layout Pass

Moved `Connect MIDI`, `Clear MIDI Learn`, `Kill Loops`, `Reset`, and `Fullscreen` into a stage action bar below the visual window. The debug panel is now a separate non-overlapping control surface on desktop-sized viewports, and the fullscreen toggle targets the visual stage. Fullscreen mode now removes the faux browser chrome so the Pixi canvas fills the viewport, with an in-stage corner `Exit` button to return to the regular interface. The renderer now resizes to the detected canvas size and cover-scales the 1280 x 720 scene to avoid black bands in fullscreen.

## Phase 0 Stabilization Pass

Fixed the fullscreen FX scaling regression by updating `VisualEngine` filter bounds from the actual presentation canvas size after resize/fullscreen changes. Added `MIDI_ZERO_DEADZONE = 0.02` after MIDI CC normalization while preserving raw, normalized, post-deadzone, and role data in the MIDI debug monitor.

## Temporal Grid Prototype Pass

Extended `src/visuals/ImageSequenceLoopLayer.ts` so major-key image-sequence loops can render as temporal grids. `density` selects 1x1, 2x2, 4x4, 6x6, or 8x8 layouts, with mobile/touch-sized screens capped at 6x6. `speed` advances frames, `chaos` offsets tile timing, and `distortion` adds tile jitter/spread. Empty frame lists remain safe and draw procedural tiled placeholders.

## Temporal Mode Expansion Pass

Added per-slot temporal modes to `src/visuals/imageSequenceManifest.ts`. Major 1 uses `uniform`, Major 2 uses `cascade`, Major 3 uses `wave`, and Major 4 uses deterministic `randomized`. The randomized mode uses seeded tile offsets instead of new random values each frame, so it should stay stable without flicker.

## Screensaver Node Scaffold Pass

Added `activeScreensaverNodes` to state and `src/visuals/ScreensaverNodeLayer.ts` to render procedural screensaver visuals. This first scaffold was later corrected so black-key notes own screensaver holds while drum pads remain burst-only. The first node types are `bouncing-shape` and `starfield`; both respond to global FX and require no image assets.

## Input Role Split Correction

Separated the live MIDI performance roles. White-key MIDI notes toggle major image-sequence loops. Black-key MIDI notes start procedural Screensaver Node holds with a sine-like alpha/scale pulse, and note-off releases them into an eased fade-out. Drum-pad MIDI notes trigger pooled bursts only and no longer activate screensavers. This keeps uploaded image sequences, procedural screensavers, and burst accents as separate visual systems.

## Performance Edge Dock Pass

Added `src/ui/PerformanceEdgeDock.ts` and `src/ui/performanceDockConfig.ts` for a fullscreen-stage bottom-corner touch overlay with `GRID`, `TV`, `PLAY`, and `FX` panels. The dock dispatches loop toggles, bursts, kill/reset, and FX changes through `InputRouter`; it does not manipulate Pixi visuals directly. A quick `Reset` appears beside the menu after dock-driven changes and stays visible across submenus until used. The overlay root is pointer-safe so the stage remains playable outside visible dock controls.

## v1.1 Light Documentation Update

This is a small update inside active v1, not a new major version. The separate root `NEXT_CHAT_PROMPT.md` artifact was removed so the project docs remain the source of truth. Current continuation guidance lives in `README.md`, `HANDOFF.md`, `EVALUATION.md`, `PROTOTYPE_V1.md`, and this version note.

## Event-Readiness Touch / Sequence Pass

Added a temporary `Big grid` mode for iPad event testing. It enlarges the playable stage, hides debug/action clutter, and keeps in-stage `Exit` plus the Performance Edge Dock `Menu` available.

Touch input is simplified for the event: touch no longer controls global FX directly. Touch taps/holds now route burst, burst-hold, and paired screensaver-start/release events through `InputRouter`. Keyboard and MIDI drum pads also emit burst hold/release state so the same visual path can be tested without iPad hardware.

Expanded active sequence infrastructure from four major slots to five named loop slots: Vaporwave, Chrome Tide, Signal Garden, Glass Desert, and Neon Weather. Each slot now has 32-frame ping-pong playback scaffolding while empty frame lists still render safe procedural placeholders.

Expanded `ScreensaverNodeLayer` from two placeholder node types to lightweight vector scaffolds for grid ocean, clouds, sandstorm, rain, wind, starfield, mystify, static, and pulse. These remain procedural and avoid new dependencies, image assets, and heavy shaders.

## Current Validation

```powershell
npm.cmd run build
```

Result: pass.

Latest review: 2026-05-05, no new version snapshot created.

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
