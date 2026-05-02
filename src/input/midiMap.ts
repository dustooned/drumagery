import { BURST_COUNT, LOOP_COUNT } from "../constants";
import type { GlobalFXControl } from "../state/types";

export type MidiFxControl = GlobalFXControl;

export interface MidiNoteMap {
  firstLoopNote: number;
  padBurstNotes: number[];
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

const secondaryControls: MidiFxControl[] = ["chromaShift", "pixelate", "density", "scale", "fade", "burstPower"];

export const midiMap: MidiMap = {
  notes: {
    // Provisional until MiniLab MkII calibration records exact raw note values.
    firstLoopNote: 48,
    padBurstNotes: [36, 37, 38, 39]
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
  const loopId = note - midiMap.notes.firstLoopNote;
  return loopId >= 0 && loopId < LOOP_COUNT ? loopId : null;
}

export function noteToBurstId(note: number): number | null {
  const burstId = midiMap.notes.padBurstNotes.indexOf(note);
  return burstId >= 0 && burstId < BURST_COUNT ? burstId : null;
}
