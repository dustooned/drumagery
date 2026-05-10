# Version v1.3.5

Status: checkpoint

Date: 2026-05-10

## Purpose

Mark the reactive burst-mode and deployment-label pass as a stable checkpoint inside the active v1 prototype.

## Included State

- Manual FX remain the default performance mode.
- Reactive mode is opt-in and starts disabled.
- The bottom stage action row includes a `Reactive off/on` toggle.
- The debug panel includes a matching Reactive mode option under Drum pad bursts.
- Fullscreen and Big grid modes show a bottom-left array-sprite Reactive toggle.
- Held/slid burst gestures report pressure and XY movement through `InputRouter`.
- `StateEngine` stores live burst-hold pressure and XY values without mutating manual `globalFX`.
- `VisualEngine` only composes temporary burst TV overlays when Reactive mode is enabled.
- Burst TV overlays are tuned down to roughly one-third strength and build about twice as slowly.
- Reactive burst profiles now blend secondary effects from XY position, center/edge placement, diagonal crossing, pressure, and slow hold drift so held touch feels less repetitive.
- Two simultaneous touch holds now keep separate hold identities and add a center-point blend layer with slightly stronger mixed feedback, phosphor, chroma, sync, bloom, and noise.
- Reactive profiles are organized by burst zone, with Y mapped to TV effectors and X mapped to support/visual effectors. Cross-axis movement adds a smaller bridge effect.
- Reactive palettes now spread chroma, hue shift, bloom, sync bands, sync tear, and density across different burst zones instead of leaning on one dominant effect.
- Fast finger movement creates a short movement impulse that spikes Reactive intensity and eases back over roughly 520ms.
- Flash and Glitch are separated: Flash favors bloom/contrast/hue/density brightness, while Glitch favors chroma shift, sync tear, sync bands, noise, and distortion.
- Vertical roll is fully removed from Reactive mode. Manual controls own all sustained and impact-style v-roll behavior.
- Releasing a held burst fades the temporary TV overlay back to the user's manual FX baseline.
- Glass Desert now uses `screen` blend mode instead of `multiply` to avoid blacking out the stage.
- Reset remains the way to clear user-set manual FX.
- GitHub Pages output in `docs/` is refreshed through `npm.cmd run build:pages`.

## Validation

```powershell
npm.cmd run build
npm.cmd run build:pages
```

Result: pass.

## Deployment Note

GitHub Pages uses `main / docs`, so deploy-visible changes still require `npm.cmd run build:pages` before committing and pushing.

## Next Work

- Test Reactive mode on target iPad Safari and projector output.
- Tune individual burst TV personalities after seeing the live-room feel.
- Confirm bottom action-row, debug-panel, fullscreen, and Big grid toggles are all legible in performance conditions.
