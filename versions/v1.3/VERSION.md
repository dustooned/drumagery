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
- The XP-style desktop background is loaded from `public/wallpapers/xp-desktop/xp-desktop.png`.
- The fullscreen Performance Edge Dock uses emoji/icon display labels, while input routing remains tied to stable `data-*` attributes and state control IDs.
- Canvas touch input no longer toggles image loops; it is reserved for burst/screensaver behavior.
- Arturia MiniLab MkII channel 1 pitch-bend messages (`command 224`) control `verticalRoll` directly.
- Screensaver node vectors are thicker and brighter for stronger stage visibility.
- Major image-sequence slots now carry explicit blend modes matched to their titles.
- A subtle XP-style desktop taskbar provides a Start popover with version/app/contact information and a link to `https://www.dustooned.com/`.
- The Start popover fades in/out over `800ms ease`, auto-closes after 5 seconds, and closes when Start is clicked again.
- The taskbar includes a hide/restore control for the default desktop/debug layout and is hidden in Big grid/fullscreen modes.
- Taskbar sprite drop paths are `public/taskbar/start-button/start-button.png` and `public/taskbar/hide-button/hide-button.png`.

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
- Later control-polish check confirmed Big grid emoji dock labels render, top-canvas touch no longer toggles loops, and console warnings/errors remain 0.

## Deployment Note

GitHub Pages uses `main / docs`, so `npm.cmd run build:pages` must be run before committing any deploy-visible change. This checkpoint includes refreshed `docs/` output and copied sequence assets.

## Next Work

- Test the five uploaded sequence loops on target iPad Safari and projector output.
- Tune per-slot FPS, scale, anchor, and temporal modes after seeing the loops in the room.
- Watch load time and memory now that PNG sequences are active assets.
- Keep MIDI optional and preserve keyboard/touch/debug fallbacks.
- Click-test the taskbar Start popover and hide/restore behavior in the target browser.
