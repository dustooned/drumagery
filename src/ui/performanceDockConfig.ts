import type { GlobalFXControl } from "../state/types";

export type DockCategory = "grid" | "tv" | "play" | "fx";

export interface DockCategoryConfig {
  id: DockCategory;
  label: string;
  controls: GlobalFXControl[];
}

export const PERFORMANCE_DOCK_CATEGORIES: DockCategoryConfig[] = [
  {
    id: "grid",
    label: "GRID",
    controls: ["density", "chaos", "distortion"]
  },
  {
    id: "tv",
    label: "TV",
    controls: ["chromaShift", "verticalRoll", "syncTear", "syncBands", "pixelate", "phosphorTrail"]
  },
  {
    id: "play",
    label: "PLAY",
    controls: ["burstPower", "fade"]
  },
  {
    id: "fx",
    label: "FX",
    controls: ["intensity", "speed", "scale", "feedback", "bloom", "noise", "contrast"]
  }
];
