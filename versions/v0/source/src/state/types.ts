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
  hue: number;
  speed: number;
  distortion: number;
  intensity: number;
}

export interface InstrumentState {
  activeLoops: LoopState[];
  burstQueue: BurstEvent[];
  globalFX: GlobalFXState;
}

export type StateListener = (state: InstrumentState) => void;
