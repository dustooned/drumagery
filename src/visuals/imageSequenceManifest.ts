export type ImageSequenceSlotId = "major-1" | "major-2" | "major-3" | "major-4";
export type TemporalMode = "uniform" | "cascade" | "wave" | "randomized";

export interface ImageSequenceSlot {
  id: ImageSequenceSlotId;
  loopId: number;
  name: string;
  framePaths: string[];
  fps: number;
  anchorX: number;
  anchorY: number;
  baseScale: number;
  hueOffset: number;
  temporalMode: TemporalMode;
}

export const IMAGE_SEQUENCE_SLOTS: ImageSequenceSlot[] = [
  {
    id: "major-1",
    loopId: 0,
    name: "Major 1",
    framePaths: [],
    fps: 12,
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 1,
    hueOffset: 0.02,
    temporalMode: "uniform"
  },
  {
    id: "major-2",
    loopId: 1,
    name: "Major 2",
    framePaths: [],
    fps: 10,
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 0.92,
    hueOffset: 0.18,
    temporalMode: "cascade"
  },
  {
    id: "major-3",
    loopId: 2,
    name: "Major 3",
    framePaths: [],
    fps: 9,
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 1.08,
    hueOffset: 0.34,
    temporalMode: "wave"
  },
  {
    id: "major-4",
    loopId: 3,
    name: "Major 4",
    framePaths: [],
    fps: 8,
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 1,
    hueOffset: 0.52,
    temporalMode: "randomized"
  }
];

export function getImageSequenceSlotForLoop(loopId: number): ImageSequenceSlot | null {
  return IMAGE_SEQUENCE_SLOTS.find((slot) => slot.loopId === loopId) ?? null;
}
