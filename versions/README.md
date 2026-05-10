# Versions

This folder stores source checkpoints for each stable iteration.

## v0

Path:

```text
versions/v0
```

Baseline Vite + TypeScript + PixiJS visual instrument scaffold with keyboard, touch, debug, optional MIDI input, state engine, debug monitor, and placeholder visuals.

## v1.3

Path:

```text
versions/v1.3
```

Uploaded PNG sequence checkpoint for the active v1 performance instrument. Five major-key image-sequence loop slots are wired to uploaded 24-frame PNG sequences, using frames `00000` through `00023` while exported `00024` files remain unused. The Pages build in `docs/` was refreshed with copied sequence assets.

Validation:
- `npm.cmd run build`: pass.
- `npm.cmd run build:pages`: pass.
- Local browser check at `http://localhost:5173/drumagery/`: keys `1` through `5` active with 0 console warnings/errors.

Next likely work: test and tune the five sequence loops on target iPad Safari/projector output, especially FPS, scale, anchor, load time, and touch ergonomics.

## v1.3.5

Path:

```text
versions/v1.3.5
```

Reactive burst-mode checkpoint for the active v1 performance instrument. Manual FX remain the default baseline. Reactive mode is off by default and can be enabled from the bottom stage actions, the debug panel, or the fullscreen/Big-grid corner sprite control. When enabled, held/slid burst gestures temporarily layer burst-specific TV effects over the user's current manual FX values and fade back on release.

Validation:
- `npm.cmd run build`: pass.
- `npm.cmd run build:pages`: pass.

Next likely work: target-device testing on iPad Safari and projector output, especially Reactive mode strength, button placement in Big grid/fullscreen, and dock readability.

## v1.3.6

Path:

```text
versions/v1.3.6
```

Reactive burst-effector retune checkpoint. Reactive mode remains opt-in and manual FX remain the baseline. This pass removes vertical roll from Reactive mode, separates Flash and Glitch more clearly, broadens the burst-zone effect palettes, adds per-touch movement-speed impulse energy, and keeps two-finger center blending.

Validation:
- `npm.cmd run build`: pass.
- `npm.cmd run build:pages`: pass.

Next likely work: target-device testing on iPad Safari and projector output, especially whether Flash and Glitch now read as distinct live burst tools.

## v1

Path:

```text
versions/v1
```

In-progress performance-control iteration. The current stable note above this is `versions/v1.3.6`.

Current v1 includes:
- MIDI calibration UI and grouped learned CC slots.
- XP-adjacent desktop/browser-window shell.
- 3x FX input ranges, with touch currently simplified to burst-pad holds for event stability.
- Whole-stage retro-TV filters: sync tear, chroma split, vertical roll, hard sync bands, and pixelate.
- Procedural phosphor trail layer.
- Five major-key image-sequence loop slots wired to uploaded 24 PNG frames each, with procedural placeholders still available when frame lists are empty.
- Temporal grid rendering for major-key loops, driven by density, speed, chaos, distortion, per-slot temporal modes, PNG frame sequences, and 24-frame procedural fallback scaffolding.
- Black-key Screensaver Node holds with lightweight procedural node categories.
- Drum-pad bursts and burst holds remain separate performance accents.
- Temporary `Big grid` mode for iPad event testing.
- Fullscreen-stage Performance Edge Dock with GRID, TV, PLAY, and FX panels.

Next likely work: test `Big grid`, touch burst holds, black-key screensaver holds, drum-pad bursts, the five uploaded loops, and the Edge Dock on the target iPad/browser.

Note: the separate root next-chat prompt artifact has been removed. Use the root docs and `versions/v1/VERSION.md` for continuation context.

## Versioning Rule

Each stable iteration should include:
- `VERSION.md`
- source snapshot
- evaluation notes or links back to root evaluation docs
- build status
- known gaps
