import type { GlobalFXControl, GlobalFXState } from "./types";

export interface FXControlConfig {
  control: GlobalFXControl;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  smoothing: number;
}

const FX_MAX_MULTIPLIER = 3;

export const FX_CONTROLS: FXControlConfig[] = [
  { control: "intensity", label: "Intensity", defaultValue: 0.65, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 10 },
  { control: "bloom", label: "Bloom", defaultValue: 0.18, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 8 },
  { control: "distortion", label: "Distort", defaultValue: 0, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 9 },
  { control: "syncTear", label: "Sync Tear", defaultValue: 0, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 12 },
  { control: "chromaShift", label: "Chroma", defaultValue: 0, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 12 },
  { control: "feedback", label: "Feedback", defaultValue: 0.25, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 5 },
  { control: "noise", label: "Noise", defaultValue: 0, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 12 },
  { control: "density", label: "Density", defaultValue: 0.55, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 8 },
  { control: "contrast", label: "Contrast", defaultValue: 0.45, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 9 },
  { control: "chaos", label: "Chaos", defaultValue: 0, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 10 },
  { control: "scale", label: "Scale", defaultValue: 0.5, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 7 },
  { control: "fade", label: "Fade", defaultValue: 0.5, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 6 },
  { control: "hue", label: "Hue", defaultValue: 0.5, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 5 },
  { control: "speed", label: "Speed", defaultValue: 1, min: 0.2, max: 2 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 6 },
  { control: "pixelate", label: "Pixel", defaultValue: 0, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 14 },
  { control: "burstPower", label: "Burst", defaultValue: 0.65, min: 0, max: 1 * FX_MAX_MULTIPLIER, step: 0.01, smoothing: 12 }
];

export function createDefaultGlobalFX(): GlobalFXState {
  return FX_CONTROLS.reduce((fx, config) => {
    fx[config.control] = config.defaultValue;
    return fx;
  }, {} as GlobalFXState);
}

export function getFXControlConfig(control: GlobalFXControl): FXControlConfig {
  const config = FX_CONTROLS.find((item) => item.control === control);
  if (!config) {
    throw new Error(`Unknown FX control: ${control}`);
  }

  return config;
}

export function normalizeFXControl(control: GlobalFXControl, value: number): number {
  const config = getFXControlConfig(control);
  return Math.min(config.max, Math.max(config.min, value));
}

export function scaleNormalizedFXControl(control: GlobalFXControl, normalized: number): number {
  const config = getFXControlConfig(control);
  return config.min + Math.min(1, Math.max(0, normalized)) * (config.max - config.min);
}
