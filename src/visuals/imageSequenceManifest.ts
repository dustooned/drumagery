export type ImageSequenceSlotId = "vaporwave" | "chrome-tide" | "signal-garden" | "glass-desert" | "neon-weather";
export type TemporalMode = "uniform" | "cascade" | "wave" | "randomized";
export type SequencePlaybackMode = "loop" | "ping-pong";

export interface ImageSequenceSlot {
  id: ImageSequenceSlotId;
  loopId: number;
  name: string;
  framePaths: string[];
  expectedFrameCount: number;
  fps: number;
  playbackMode: SequencePlaybackMode;
  anchorX: number;
  anchorY: number;
  baseScale: number;
  hueOffset: number;
  temporalMode: TemporalMode;
}

export const IMAGE_SEQUENCE_SLOTS: ImageSequenceSlot[] = [
  {
    id: "vaporwave",
    loopId: 0,
    name: "Vaporwave",
    framePaths: [],
    expectedFrameCount: 32,
    fps: 12,
    playbackMode: "ping-pong",
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 1,
    hueOffset: 0.02,
    temporalMode: "uniform"
  },
  {
    id: "chrome-tide",
    loopId: 1,
    name: "Chrome Tide",
    framePaths: [],
    expectedFrameCount: 32,
    fps: 10,
    playbackMode: "ping-pong",
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 0.92,
    hueOffset: 0.18,
    temporalMode: "cascade"
  },
  {
    id: "signal-garden",
    loopId: 2,
    name: "Signal Garden",
    framePaths: [],
    expectedFrameCount: 32,
    fps: 9,
    playbackMode: "ping-pong",
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 1.08,
    hueOffset: 0.34,
    temporalMode: "wave"
  },
  {
    id: "glass-desert",
    loopId: 3,
    name: "Glass Desert",
    framePaths: [],
    expectedFrameCount: 32,
    fps: 8,
    playbackMode: "ping-pong",
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 1,
    hueOffset: 0.52,
    temporalMode: "randomized"
  },
  {
    id: "neon-weather",
    loopId: 4,
    name: "Neon Weather",
    framePaths: [],
    expectedFrameCount: 32,
    fps: 8,
    playbackMode: "ping-pong",
    anchorX: 0.5,
    anchorY: 0.5,
    baseScale: 0.96,
    hueOffset: 0.68,
    temporalMode: "wave"
  }
];

export function getImageSequenceSlotForLoop(loopId: number): ImageSequenceSlot | null {
  return IMAGE_SEQUENCE_SLOTS.find((slot) => slot.loopId === loopId) ?? null;
}
