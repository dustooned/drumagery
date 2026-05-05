export type ImageSequenceSlotId = "vaporwave" | "chrome-tide" | "signal-garden" | "glass-desert" | "neon-weather";
export type TemporalMode = "uniform" | "cascade" | "wave" | "randomized";
export type SequencePlaybackMode = "loop" | "ping-pong";

const assetPath = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const createFramePaths = (folder: string, prefix: string, extension = "png", count = 24, startIndex = 0): string[] =>
  Array.from({ length: count }, (_, index) => assetPath(`${folder}/${prefix}_${String(index + startIndex).padStart(5, "0")}.${extension}`));

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
    framePaths: createFramePaths("sequences/vaporwave", "vaporwave"),
    expectedFrameCount: 24,
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
    framePaths: createFramePaths("sequences/chrome-tide", "chrome_tide"),
    expectedFrameCount: 24,
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
    framePaths: createFramePaths("sequences/signal-garden", "signal-garden"),
    expectedFrameCount: 24,
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
    framePaths: createFramePaths("sequences/glass-desert", "glass-desert"),
    expectedFrameCount: 24,
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
    framePaths: createFramePaths("sequences/neon-weather", "neon-weather"),
    expectedFrameCount: 24,
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
