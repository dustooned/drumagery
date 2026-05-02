# Versions

This folder stores source checkpoints for each stable iteration.

## v0

Path:

```text
versions/v0
```

Baseline Vite + TypeScript + PixiJS visual instrument scaffold with keyboard, touch, debug, optional MIDI input, state engine, debug monitor, and placeholder visuals.

## v1

Path:

```text
versions/v1
```

In-progress performance-control iteration. No source snapshot yet; current source is the active v1 working tree. The current lightweight checkpoint is v1.1 inside v1, not a new major version.

Current v1 includes:
- MIDI calibration UI and grouped learned CC slots.
- XP-adjacent desktop/browser-window shell.
- 3x FX input ranges and analog touch sliding.
- Whole-stage retro-TV filters: sync tear, chroma split, vertical roll, hard sync bands, and pixelate.
- Procedural phosphor trail layer.
- Major-key image-sequence loop slot infrastructure with procedural placeholders when frame lists are empty.
- Temporal grid rendering for major-key loops, driven by density, speed, chaos, distortion, and per-slot temporal modes.
- Minor-key/pad Screensaver Node scaffold with procedural bouncing-shape and starfield nodes beside the existing burst pool.

Next likely work: evaluate temporal grids and pad nodes in-browser, then add the Performance Edge Dock UI or real frame paths while keeping minor-key/pad visuals procedural.

Note: the separate root next-chat prompt artifact has been removed. Use the root docs and `versions/v1/VERSION.md` for continuation context.

## Versioning Rule

Each stable iteration should include:
- `VERSION.md`
- source snapshot
- evaluation notes or links back to root evaluation docs
- build status
- known gaps
