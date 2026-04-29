# MIDI Visual Instrument — Master Prototype Spec

## Project Intent
Create a browser-based playable visual instrument using an Arturia MiniLab MkII, projected live for audience interaction.

## Core Design Principle
MIDI Input → State Engine → Visual Renderer

## Controller Role Architecture

### Keys — Persistent Visual Loops
- Toggle looping visuals on/off
- 3–5 active layer cap
- Includes kill/reset keys

Examples:
- Ink clouds
- Symbol fields
- Parallax textures
- PNG sequences

### Drum Pads — Impulse Bursts
Velocity-sensitive momentary events:
- Flash
- Particle burst
- Shockwave
- Glitch hit

### Knobs — Global Effect Modifiers
Suggested mappings:
1. Intensity
2. Bloom
3. Distortion
4. Feedback
5. Noise
6. Density
7. Contrast
8. Master chaos

### Touch Strips / Sliders
- Global playback speed
- Global hue/color drift

## VJ Effect Taxonomy

### Generators
Create imagery:
- particles
- geometry
- looped assets
- fluid forms

### Modifiers
Alter imagery:
- glitch
- blur
- displacement
- edge effects

### Impulses
Momentary punctuation:
- flashes
- beat punches
- burst events

### Global transforms
- tempo
- zoom
- hue drift

## State Model

```js
state = {
 activeLoops: [],
 burstQueue: [],
 globalFX: {
   hue:.5,
   speed:1.0,
   distortion:0
 }
}
```

## First Prototype (Version 0)
Build only:
- 4 loop visuals
- 4 burst effects
- 4 knob controls
- 2 strip controls

Focus on combinations, not quantity.

## Performance Constraints
- Cap active loops
- Pool particles
- Limit expensive post effects
- Use optimized assets
- Prefer procedural visuals

## Arturia MiniLab MkII Relevant Inputs
- 25 velocity keys
- 16 encoders
- 8 pads / 16 with bank switching
- pitch strip
- mod strip
- customizable MIDI mappings

## Prototype Begins With MIDI Debug Monitor
Display:
- note numbers
- CC values
- velocity
- control IDs

## 3 Week Prototype Roadmap

Week 1
- MIDI debug
- state engine
- placeholder visuals

Week 2
- pad bursts
- knob modulation
- projector testing

Week 3
- optimization
- rehearsal
- event-ready build

## Design Philosophy
Not reactive visuals.

A playable visual instrument.
