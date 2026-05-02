import { BURST_COUNT, LOOP_COUNT } from "../constants";
import type { GlobalFXControl } from "../state/types";

export type MidiFxControl = GlobalFXControl;

export interface MidiNoteMap {
  majorSequenceFirstNote: number;
  minorVectorBurstNotes: number[];
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
    // Major keys toggle persistent image-sequence loop slots.
    majorSequenceFirstNote: 48,
    // Minor keys/pads trigger short-lived procedural vector bursts.
    minorVectorBurstNotes: [36, 37, 38, 39]
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
  const loopId = note - midiMap.notes.majorSequenceFirstNote;
  return loopId >= 0 && loopId < LOOP_COUNT ? loopId : null;
}

export function noteToBurstId(note: number): number | null {
  const burstId = midiMap.notes.minorVectorBurstNotes.indexOf(note);
  return burstId >= 0 && burstId < BURST_COUNT ? burstId : null;
}
