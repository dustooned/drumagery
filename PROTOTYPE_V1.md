# Prototype V1

## Purpose

Build a stable performance-control layer while preserving the v0 fallback paths.

## First Goal

Move MIDI role assumptions into a dedicated mapping module so MiniLab MkII calibration has one source of truth.

Status: implemented in the active v1 working tree.

## Planned Scope

- MIDI/controller map for:
  - keys as persistent loop toggles
  - pads as burst triggers
  - knobs as performance controls
  - strips as speed/hue controls
- Improved MIDI debug readout for calibration.
- Recent MIDI message history.
- Learned CC assignment display.
- Expanded live performance controls: intensity, bloom, distortion, syncTear, chromaShift, verticalRoll, phosphorTrail, syncBands, feedback, noise, density, contrast, chaos, scale, fade, hue, speed, pixelate, burstPower.
- Keep keyboard and touch behavior unchanged.
- Keep placeholder visuals until input behavior is reliable.

## Current Review

Date: 2026-04-27

The active v1 pass is still a calibration layer, not a new frozen version. The current build passes and the next step is hardware mapping capture in desktop Chrome or Edge.

Hardening pass completed:
- resettable MIDI CC learning
- no stale burst queue readout
- throttled debug repainting during MIDI streams

Performance-control pass completed:
- expanded `globalFX`
- added the initial debug sliders
- mapped learned MIDI CCs to art-performance controls
- made placeholder loops and bursts visibly respond to the new parameters

Input-feel pass completed:
- centralized FX parameter config in `src/state/fxConfig.ts`
- added renderer-side parameter smoothing
- added `Kill Loops`
- added velocity-dependent burst attack/decay

Visual-response config pass completed:
- added `src/visuals/visualConfig.ts`
- separated controller values from art response strength
- moved loop, burst, and background response tuning out of drawing code

Calibration slot pass completed:
- learned MIDI CC assignments now display as ordered performance-control slots
- empty slots remain visible during calibration

Controller-layout pass completed:
- split `src/input/midiMap.ts` controls into knob, strip, and secondary groups
- reserved `speed` and `hue` for touch strips/sliders instead of the main knob bank
- grouped the MIDI calibration readout to match the physical layout

Sync-tear pass completed:
- added `syncTear` as a global FX control
- implemented whole-stage sawtooth analog-TV tearing in `src/visuals/SyncTearFilter.ts`
- moved `density` to the secondary calibration group so the main knob bank stays eight controls

Effector expansion pass completed:
- added master-doc effectors for bloom, feedback, noise, contrast, and chaos
- added `pixelate` as a whole-stage Pixi filter parameter
- kept the effect pass dependency-free and routed through `globalFX`

Debug/performance UI pass completed:
- grouped manual controls by controller role
- added `Hide controls` / `Show controls` so the visual stage can be used without the debug panel covering touch or projector output
- kept the debug panel mounted so MIDI data and state readouts continue updating while hidden

Expanded-range and analog-touch pass completed:
- raised every FX max input to 3x the original maximum
- kept defaults unchanged so the startup state remains stable
- made stage touch sliding continuously update `hue`, `intensity`, and movement-driven `distortion`
- added two-finger spread control for `scale`

Overdrive and retro shell pass completed:
- made values above `1` visibly push procedural visuals harder
- added overdrive scanline/noise/grid behavior in `VisualEngine`
- added overdrive density, scale, line-weight, and burst-force shaping in loop and burst layers
- restyled the app as a retro desktop/browser window around the Pixi canvas

Chroma split pass completed:
- added `chromaShift` to the global FX state/config
- exposed `Chroma` in secondary manual/MIDI controls
- added `src/visuals/ChromaSplitFilter.ts` for whole-stage RGB offset
- stacked chromatic split with sync tear and pixelate in `VisualEngine`

Vertical roll pass completed:
- added `verticalRoll` to the global FX state/config
- exposed `V Roll` in secondary manual/MIDI controls
- added `src/visuals/VerticalRollFilter.ts` for whole-stage tracking drift
- stacked vertical roll between sync tear and chromatic split

Phosphor trail pass completed:
- added `phosphorTrail` to the global FX state/config
- exposed `Phosphor` in secondary manual/MIDI controls
- added `src/visuals/PhosphorTrailLayer.ts` for lightweight persistence
- records burst ghosts and draws loop afterimages without framebuffer feedback

Hard sync bands pass completed:
- added `syncBands` to the global FX state/config
- exposed `Sync Bands` in secondary manual/MIDI controls
- added `src/visuals/HardSyncBandsFilter.ts` for blocky horizontal jump/compression glitches
- stacked hard sync bands before chromatic split and pixelation

Image-sequence infrastructure pass completed:
- added `src/visuals/imageSequenceManifest.ts` as the source of truth for major-key sequence slots
- added `src/visuals/ImageSequenceLoopLayer.ts` for future frame-path playback
- major-key loop toggles now instantiate image-sequence loop layers through state
- empty frame lists draw procedural placeholders, so no external assets are required yet
- minor-key/pad burst visuals remain procedural/vector-based and pooled

MIDI role and debug spacing pass completed:
- `src/input/midiMap.ts` now names major sequence notes and minor vector burst notes explicitly
- MIDI debug roles report major sequence loops separately from minor vector bursts
- debug panel sections are labeled `Major image loops` and `Minor vector bursts`
- debug panel bottom spacing was increased so the MIDI action buttons are easier to see

Stage actions and fullscreen layout pass completed:
- moved `Connect MIDI`, `Clear MIDI Learn`, `Kill Loops`, `Reset`, and `Fullscreen` below the visual stage
- kept the debug panel focused on tuning, state, and MIDI calibration readouts
- changed the desktop layout so the 1280x720 visual window and debug menu do not overlap
- added fullscreen toggle behavior for the visual stage

Current next step:
- add the first real major-key frame paths to the image-sequence manifest
- tune per-slot FPS, scale, and anchor after assets exist
- preserve iPad Safari compatibility and do not require MIDI for the fallback path
- use `NEXT_CHAT_PROMPT.md` to continue in a fresh chat

Run through Vite:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:5173
```

Do not open `index.html` directly for this project.

## Out Of Scope For First v1 Pass

- Final visual art direction.
- External image or video assets.
- Expensive shaders.
- Removing touch/debug fallbacks.
