import { BURST_COUNT, LOOP_COUNT } from "../constants";
import type { GlobalFXControl } from "../state/types";

export type MidiFxControl = GlobalFXControl;

export const MIDI_ZERO_DEADZONE = 0.02;

export interface MidiNoteMap {
  majorSequenceNotes: number[];
  minorScreensaverNotes: number[];
  drumPadBurstNotes: number[];
}

export interface MidiControlMap {
  knobControls: MidiFxControl[];
  stripControls: MidiFxControl[];
  secondaryControls: MidiFxControl[];
  learnedControls: MidiFxControl[];
}

export interface MidiMap {
  notes: MidiNoteMap;
  controls: MidiControlMap;
}

const knobControls: MidiFxControl[] = [
  "intensity",
  "bloom",
  "distortion",
  "syncTear",
  "feedback",
  "noise",
  "contrast",
  "chaos"
];

const stripControls: MidiFxControl[] = ["speed", "hue"];

const secondaryControls: MidiFxControl[] = [
  "chromaShift",
  "verticalRoll",
  "phosphorTrail",
  "syncBands",
  "pixelate",
  "density",
  "scale",
  "fade",
  "burstPower"
];

export const midiMap: MidiMap = {
  notes: {
    // Provisional until MiniLab MkII calibration records exact raw note values.
    // White-key notes toggle persistent image-sequence loop slots.
    majorSequenceNotes: [48, 50, 52, 53, 55],
    // Black-key notes hold procedural screensaver layers.
    minorScreensaverNotes: [49, 51, 54, 56],
    // Drum pads trigger short-lived procedural vector bursts only.
    drumPadBurstNotes: [36, 37, 38, 39]
  },
  controls: {
    // Learn order follows the physical controller: knobs first, then touch strips, then secondary controls.
    knobControls,
    stripControls,
    secondaryControls,
    learnedControls: [...knobControls, ...stripControls, ...secondaryControls]
  }
};

export function noteToLoopId(note: number): number | null {
  const loopId = midiMap.notes.majorSequenceNotes.indexOf(note);
  return loopId >= 0 && loopId < LOOP_COUNT ? loopId : null;
}

export function noteToBurstId(note: number): number | null {
  const burstId = midiMap.notes.drumPadBurstNotes.indexOf(note);
  return burstId >= 0 && burstId < BURST_COUNT ? burstId : null;
}

export function noteToScreensaverId(note: number): number | null {
  const screensaverId = midiMap.notes.minorScreensaverNotes.indexOf(note);
  return screensaverId >= 0 && screensaverId < BURST_COUNT ? screensaverId : null;
}
