# Dio Visual Instrument - AGENTS.md

## Project Goal
A browser-based playable visual instrument that works across:
- Desktop browsers (Chrome, Edge, Firefox)
- iPad Safari (no MIDI dependency)

## Core Architecture
Input -> State Engine -> Visual Engine

## Constraints (CRITICAL)
- Must run on iPad Safari (no Web MIDI required)
- Must not rely on external assets (no PNG sequences yet)
- Must maintain 60fps on mid-range devices
- Must degrade gracefully if features unsupported

## Input System Design
All inputs must go through InputRouter.

Supported inputs:
- KeyboardInput (primary dev testing)
- TouchInput (iPad compatibility)
- MidiInput (desktop only, optional)
- DebugInput (fallback/testing)

NEVER bind visuals directly to MIDI.

## State Model

state = {
  activeLoops: [],
  burstQueue: [],
  globalFX: {
    hue: 0.5,
    speed: 1.0,
    distortion: 0
  }
}

State is the single source of truth.

## Visual System Rules

Loops:
- persistent
- max 3-5 active

Bursts:
- short-lived
- pooled (no memory spikes)

Global FX:
- applied uniformly across all visuals

## Performance Rules

- Use object pooling for particles
- Avoid expensive shaders in v0
- Prefer procedural visuals over assets
- Cap loop count
- No blocking operations

## Rendering

- PixiJS renderer
- Internal resolution: 1280x720
- Scales to fullscreen
- Must support projector output

## Code Structure

/src
  /input
  /visuals
  /state
  /ui
  /utils

## Development Rules for Codex

- Build in small steps
- Always produce working state
- Do not introduce new dependencies unless required
- Prioritize stability over features
- Test compatibility assumptions before implementation
