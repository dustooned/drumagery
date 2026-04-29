# Prototype V0

## Purpose

Create the first working browser-native instrument scaffold.

## Included

- Vite + TypeScript + PixiJS project.
- Fullscreen PixiJS renderer.
- `InputRouter` as the single input gateway.
- `StateEngine` with:
  - `activeLoops`
  - `burstQueue`
  - `globalFX`
- Keyboard input.
- Touch input.
- Optional Web MIDI input.
- Debug panel.
- Empty/procedural loop placeholders.
- Pooled burst placeholders.

## MIDI Behavior

MIDI is optional and desktop-only.

The v0 implementation starts with a debug-first approach:
- Click `Connect MIDI`.
- Browser requests Web MIDI permission.
- Debug panel reports status and raw note/CC messages.

Initial provisional mapping:
- Notes `48-51`: loops 1-4.
- Pad notes `36-39`: bursts 1-4.
- First four unique CCs: intensity, distortion, hue, speed.

## Saved Checkpoint

The v0 source snapshot is stored at:

```text
versions/v0/source
```
