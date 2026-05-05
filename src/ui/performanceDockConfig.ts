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
    controls: ["density", "scale", "chaos", "distortion"]
  },
  {
    id: "tv",
    label: "TV",
    controls: ["chromaShift", "syncTear", "verticalRoll", "phosphorTrail", "syncBands", "pixelate"]
  },
  {
    id: "play",
    label: "PLAY",
    controls: ["speed", "fade", "burstPower"]
  },
  {
    id: "fx",
    label: "FX",
    controls: ["intensity", "hue", "feedback", "bloom", "contrast", "noise"]
  }
];
