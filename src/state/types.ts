export interface LoopState {
  id: number;
  name: string;
  startedAt: number;
}

export interface BurstEvent {
  id: number;
  name: string;
  createdAt: number;
  velocity: number;
  x: number;
  y: number;
}

export interface GlobalFXState {
  intensity: number;
  bloom: number;
  distortion: number;
  syncTear: number;
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
  globalFX: GlobalFXState;
}

export type StateListener = (state: InstrumentState) => void;
