import type { ImageSequenceSlotId } from "../visuals/imageSequenceManifest";

export interface LoopState {
  id: number;
  name: string;
  startedAt: number;
  imageSequenceSlotId: ImageSequenceSlotId | null;
}

export interface BurstEvent {
  id: number;
  name: string;
  createdAt: number;
  velocity: number;
  x: number;
  y: number;
}

export interface BurstHoldState {
  id: number;
  holdKey: string;
  name: string;
  startedAt: number;
  releasedAt: number | null;
  velocity: number;
  pressure: number;
  movementEnergy: number;
  movementAt: number;
  x: number;
  y: number;
}

export type ScreensaverNodeType =
  | "grid-ocean"
  | "clouds"
  | "sandstorm"
  | "rain"
  | "wind"
  | "starfield"
  | "mystify"
  | "static"
  | "pulse";

export interface ScreensaverNodeState {
  id: number;
  type: ScreensaverNodeType;
  label: string;
  triggeredAt: number;
  releasedAt: number | null;
  velocity: number;
  x: number;
  y: number;
  seed: number;
}

export interface GlobalFXState {
  intensity: number;
  bloom: number;
  distortion: number;
  syncTear: number;
  chromaShift: number;
  verticalRoll: number;
  phosphorTrail: number;
  syncBands: number;
  feedback: number;
  noise: number;
  density: number;
  contrast: number;
  chaos: number;
  scale: number;
  fade: number;
  hue: number;
  speed: number;
  pixelate: number;
  burstPower: number;
}

export type GlobalFXControl = keyof GlobalFXState;

export interface InstrumentState {
  activeLoops: LoopState[];
  burstQueue: BurstEvent[];
  activeBurstHolds: BurstHoldState[];
  activeScreensaverNodes: ScreensaverNodeState[];
  globalFX: GlobalFXState;
  reactiveModeEnabled: boolean;
}

export type StateListener = (state: InstrumentState) => void;
