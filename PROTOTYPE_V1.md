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
- Expanded live performance controls: intensity, bloom, distortion, syncTear, feedback, noise, density, contrast, chaos, scale, fade, hue, speed, pixelate, burstPower.
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
