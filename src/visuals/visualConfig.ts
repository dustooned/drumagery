import { lerp } from "../utils/math";

export interface Range01 {
  min: number;
  max: number;
}

export interface LoopResponseConfig {
  density: Range01;
  scale: Range01;
  opacity: Range01;
  distortion: Range01;
}

export interface BurstResponseConfig {
  lifetime: Range01;
  attack: Range01;
  force: Range01;
  alpha: Range01;
  detail: Range01;
  distortion: Range01;
}

export interface BackgroundResponseConfig {
  brightness: Range01;
  washAlpha: Range01;
  gridAlpha: Range01;
  gridStep: Range01;
}

export const visualConfig = {
  loops: {
    ink: {
      density: { min: 0.2, max: 1 },
      scale: { min: 0.35, max: 0.9 },
      opacity: { min: 0.18, max: 0.7 },
      distortion: { min: 0.25, max: 0.8 }
    },
    symbols: {
      density: { min: 0.3, max: 0.95 },
      scale: { min: 0.25, max: 0.9 },
      opacity: { min: 0.35, max: 0.85 },
      distortion: { min: 0, max: 0.4 }
    },
    bands: {
      density: { min: 0.2, max: 0.85 },
      scale: { min: 0.15, max: 0.75 },
      opacity: { min: 0.16, max: 0.58 },
      distortion: { min: 0.15, max: 0.9 }
    },
    orbit: {
      density: { min: 0.25, max: 0.8 },
      scale: { min: 0.35, max: 2 },
      opacity: { min: 0.35, max: 0.9 },
      distortion: { min: 0.1, max: 4 }
    }
  } satisfies Record<string, LoopResponseConfig>,
  bursts: {
    lifetime: { min: 0.28, max: 0.72 },
    attack: { min: 0.08, max: 0.28 },
    force: { min: 0.25, max: 1 },
    alpha: { min: 0.24, max: 0.9 },
    detail: { min: 0.25, max: 1 },
    distortion: { min: 0.2, max: 0.9 }
  } satisfies BurstResponseConfig,
  background: {
    brightness: { min: 0.15, max: 0.85 },
    washAlpha: { min: 0.25, max: 0.75 },
    gridAlpha: { min: 0.2, max: 0.8 },
    gridStep: { min: 0.15, max: 0.85 }
  } satisfies BackgroundResponseConfig
};

export function responseValue(range: Range01, input: number): number {
  return lerp(range.min, range.max, clamp01(input));
}

export function responseInt(range: Range01, input: number, outputMin: number, outputMax: number): number {
  return Math.round(lerp(outputMin, outputMax, responseValue(range, input)));
}

export function responseRange(range: Range01, input: number, outputMin: number, outputMax: number): number {
  return lerp(outputMin, outputMax, responseValue(range, input));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
