# Version v1.3.6

Status: checkpoint

Date: 2026-05-10

## Purpose

Mark the Reactive burst-effector retune as a stable checkpoint inside the active v1 prototype.

## Included State

- Manual FX remain the default baseline.
- Reactive mode remains opt-in.
- Vertical roll is fully removed from Reactive mode.
- Flash favors bloom, contrast, hue, density, and short persistence.
- Glitch favors chroma shift, sync tear, sync bands, noise, distortion, and split scan slices.
- Fast finger movement creates a short movement impulse that spikes Reactive intensity and eases back over roughly `520ms`.
- Hold start impact cues use sync tear, chroma shift, sync bands, and bloom, then ease out over roughly `360ms`.
- Two simultaneous touch holds keep separate hold identities and add a center-point blend layer.
- Glass Desert uses `screen` blend mode instead of `multiply`.
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

- Test Flash, Glitch, Spark, and Shock on target iPad Safari.
- Check whether movement-speed impulse is readable without overpowering manual FX.
- Tune Reactive strength after projector testing.
