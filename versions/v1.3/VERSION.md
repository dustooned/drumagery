# Version v1.3

Status: checkpoint

Date: 2026-05-05

## Purpose

Mark the uploaded PNG image-sequence pass as a stable event-readiness checkpoint inside the active v1 prototype.

## Included State

- Five major-key loop slots are wired to uploaded PNG frame sequences:
  - Vaporwave
  - Chrome Tide
  - Signal Garden
  - Glass Desert
  - Neon Weather
- Playback uses frames `00000` through `00023` for each slot.
- Exported `00024` files stay in the asset folders but are intentionally unused while the active target remains 24 frames.
- Single-file WebP exports remain as reference assets only; active playback uses PNG frame paths.
- `src/visuals/imageSequenceManifest.ts` remains the source of truth for frame paths, FPS, scale, anchor, hue offset, and temporal mode.
- `src/visuals/ImageSequenceLoopLayer.ts` still has procedural fallback behavior if a future slot is temporarily unwired.
- Black-key screensaver holds and drum-pad bursts remain procedural and separate from uploaded image sequences.

## Validation

```powershell
npm.cmd run build
npm.cmd run build:pages
```

Result: pass.

Browser check:
- URL: `http://localhost:5173/drumagery/`
- Triggered keys `1` through `5`.
- Debug state showed all five loops active.
- Console warnings/errors: 0.

## Deployment Note

GitHub Pages uses `main / docs`, so `npm.cmd run build:pages` must be run before committing any deploy-visible change. This checkpoint includes refreshed `docs/` output and copied sequence assets.

## Next Work

- Test the five uploaded sequence loops on target iPad Safari and projector output.
- Tune per-slot FPS, scale, anchor, and temporal modes after seeing the loops in the room.
- Watch load time and memory now that PNG sequences are active assets.
- Keep MIDI optional and preserve keyboard/touch/debug fallbacks.
