# Next Chat Prompt

Use this prompt to continue the active v1 work in a fresh chat:

```text
We are continuing Drumagery in E:\2026\Dev\Experiment\UTH.

Please read AGENTS.md, README.md, HANDOFF.md, EVALUATION.md, PROTOTYPE_V1.md, versions/README.md, and versions/v1/VERSION.md first.

Current baseline:
- Vite + TypeScript + PixiJS app. Run with `npm.cmd run dev`.
- Open `http://localhost:5173` or `http://localhost:5173/drumagery/`.
- Do not open `index.html` directly.
- `InputRouter -> StateEngine -> VisualEngine` is the required architecture.
- iPad Safari must keep working without MIDI.
- Keyboard, touch, debug panel, and optional MIDI all route through state.
- `src/state/fxConfig.ts` owns control defaults/ranges/smoothing.
- `src/visuals/visualConfig.ts` owns art-response strength.
- `src/visuals/imageSequenceManifest.ts` owns major-key image-sequence slot definitions.
- `src/visuals/ImageSequenceLoopLayer.ts` renders image-sequence loops and falls back to procedural placeholders while frame lists are empty.
- `src/input/midiMap.ts` owns MIDI role assumptions and learned control order.

Current v1 features:
- XP-adjacent desktop/browser-window shell around the Pixi stage.
- Hide/show debug controls for performance mode.
- Expanded FX max input ranges: most controls `0..3`, speed `0.2..6`.
- Stage touch slide controls hue, intensity, movement-driven distortion, and two-finger scale.
- Whole-stage filters/layers include sync tear, chroma split, vertical roll, phosphor trails, hard sync bands, and pixelate.
- Major-key loop toggles route through image-sequence slots with empty frame lists that are safe placeholders for now.
- Primary knob order should remain stable: intensity, bloom, distortion, syncTear, feedback, noise, contrast, chaos.
- Secondary controls currently include chromaShift, verticalRoll, phosphorTrail, syncBands, pixelate, density, scale, fade, burstPower.

Next task:
Add the first real major-key frame paths to the image-sequence manifest, or tune the procedural placeholder look if assets are not ready yet.

Implementation direction:
- Keep `src/visuals/imageSequenceManifest.ts` as the source of truth.
- Do not make assets mandatory; empty sequence definitions must remain safe.
- Major keys should continue toggling persistent image-sequence loops on/off.
- Minor keys/pads should remain short-lived procedural/vector bursts or adjustable vector visuals.
- Keep loop count capped and burst pooling intact.
- Do not introduce new dependencies unless absolutely required.
- Preserve build stability and update docs after the pass.

Start by inspecting current source structure and then propose the smallest working implementation step. After implementation, run `npm.cmd run build` and verify in the browser if possible.
```
