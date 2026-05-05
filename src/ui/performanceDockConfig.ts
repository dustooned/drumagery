import type { GlobalFXControl } from "../state/types";

export type DockCategory = "grid" | "tv" | "play" | "fx";

export interface DockCategoryConfig {
  id: DockCategory;
  label: string;
  icon: string;
  controls: GlobalFXControl[];
}

export const PERFORMANCE_DOCK_CATEGORIES: DockCategoryConfig[] = [
  {
    id: "grid",
    label: "GRID",
    icon: "▦",
    controls: ["density", "scale", "chaos", "distortion"]
  },
  {
    id: "tv",
    label: "TV",
    icon: "📺",
    controls: ["chromaShift", "syncTear", "verticalRoll", "phosphorTrail", "syncBands", "pixelate"]
  },
  {
    id: "play",
    label: "PLAY",
    icon: "▶",
    controls: ["speed", "fade", "burstPower"]
  },
  {
    id: "fx",
    label: "FX",
    icon: "✦",
    controls: ["intensity", "hue", "feedback", "bloom", "contrast", "noise"]
  }
];
