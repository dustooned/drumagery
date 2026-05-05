import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { GlobalFXState, ScreensaverNodeState, ScreensaverNodeType } from "../state/types";
import { hslToHex } from "../utils/math";

interface ScreensaverRenderState {
  node: ScreensaverNodeState;
  fx: GlobalFXState;
  ageSeconds: number;
  releaseAgeSeconds: number | null;
  time: number;
  level: number;
}

type NodeRenderer = (graphic: Graphics, state: ScreensaverRenderState) => void;

const RELEASE_FADE_SECONDS = 0.4;

export class ScreensaverNodeLayer {
  readonly container = new Container();
  private readonly graphic = new Graphics();
  private readonly renderers: Record<ScreensaverNodeType, NodeRenderer> = {
    "grid-ocean": drawGridOcean,
    clouds: drawClouds,
    sandstorm: drawSandstorm,
    rain: drawRain,
    wind: drawWind,
    starfield: drawStarfield,
    mystify: drawMystify,
    static: drawStatic,
    pulse: drawPulse
  };
  private activeNodes: ScreensaverNodeState[] = [];
  private time = 0;

  constructor() {
    this.container.addChild(this.graphic);
  }

  syncNodes(nodes: ScreensaverNodeState[]): void {
    this.activeNodes = nodes.map((node) => ({ ...node }));
  }

  update(deltaSeconds: number, fx: GlobalFXState): void {
    this.time += deltaSeconds * Math.max(0.2, fx.speed);
    this.graphic.clear();

    for (const node of this.activeNodes) {
      const ageSeconds = (performance.now() - node.triggeredAt) / 1000;
      const releaseAgeSeconds = node.releasedAt === null ? null : (performance.now() - node.releasedAt) / 1000;
      if (releaseAgeSeconds !== null && releaseAgeSeconds > RELEASE_FADE_SECONDS) continue;

      const level = getImpactHoldLevel(ageSeconds, releaseAgeSeconds);
      this.renderers[node.type](this.graphic, {
        node,
        fx,
        ageSeconds,
        releaseAgeSeconds,
        time: this.time,
        level
      });
    }
  }
}

function drawGridOcean(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const color = hslToHex(fx.hue + 0.48, 0.76, 0.58);
  const alpha = (0.08 + fx.intensity * 0.08) * level;
  const amp = 10 + level * 28;
  const step = 42;

  graphic.lineStyle(2, color, alpha);
  for (let y = 0; y <= INTERNAL_HEIGHT; y += step) {
    graphic.moveTo(0, y);
    for (let x = 0; x <= INTERNAL_WIDTH; x += step) {
      graphic.lineTo(x, y + Math.sin(x * 0.018 + time * 2 + node.seed) * amp);
    }
  }
}

function drawClouds(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const color = hslToHex(fx.hue + 0.12, 0.22, 0.82);
  graphic.beginFill(color, 0.045 * level + fx.fade * 0.02);
  for (let i = 0; i < 8; i += 1) {
    const x = (seededRandom(node.seed + i) * INTERNAL_WIDTH + time * (10 + i * 2)) % INTERNAL_WIDTH;
    const y = seededRandom(node.seed + i * 12.3) * INTERNAL_HEIGHT * 0.65;
    const r = 28 + seededRandom(node.seed + i * 7.7) * 54 * level;
    graphic.drawEllipse(x, y, r * 1.7, r * 0.62);
  }
  graphic.endFill();
}

function drawSandstorm(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const color = hslToHex(fx.hue + 0.08, 0.6, 0.66);
  const count = Math.round(24 + level * 70);
  graphic.lineStyle(1, color, 0.12 * level);
  for (let i = 0; i < count; i += 1) {
    const x = (seededRandom(node.seed + i * 3.7) * INTERNAL_WIDTH - time * (80 + i)) % INTERNAL_WIDTH;
    const y = seededRandom(node.seed + i * 8.1) * INTERNAL_HEIGHT;
    const length = 12 + seededRandom(node.seed + i * 2.3) * 34 + fx.speed * 5;
    graphic.moveTo(wrap(x, INTERNAL_WIDTH), y);
    graphic.lineTo(wrap(x - length, INTERNAL_WIDTH), y + Math.sin(time + i) * 8);
  }
}

function drawRain(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const color = hslToHex(fx.hue + 0.58, 0.65, 0.7);
  const count = Math.round(18 + level * 58);
  graphic.lineStyle(1, color, 0.16 * level);
  for (let i = 0; i < count; i += 1) {
    const x = seededRandom(node.seed + i * 5.1) * INTERNAL_WIDTH;
    const y = (seededRandom(node.seed + i * 9.2) * INTERNAL_HEIGHT + time * (160 + fx.speed * 30)) % (INTERNAL_HEIGHT * 0.72);
    graphic.moveTo(x, y);
    graphic.lineTo(x - 5, y + 24 + level * 18);
  }
}

function drawWind(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const color = hslToHex(fx.hue + 0.36, 0.62, 0.74);
  graphic.lineStyle(2, color, 0.14 * level);
  for (let i = 0; i < 7; i += 1) {
    const y = seededRandom(node.seed + i * 15) * INTERNAL_HEIGHT;
    const offset = Math.sin(time * 0.7 + i) * 80;
    graphic.moveTo(0, y);
    for (let x = 0; x <= INTERNAL_WIDTH; x += 80) {
      graphic.lineTo(x, y + Math.sin(x * 0.02 + time * 1.8 + i) * (18 + level * 36) + offset * 0.08);
    }
  }
}

function drawStarfield(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const count = Math.round(32 + Math.min(1, fx.density / 3) * 54);
  graphic.beginFill(0xffffff, 0.22 * level + fx.contrast * 0.04);
  for (let i = 0; i < count; i += 1) {
    const seed = seededRandom(node.seed + i * 11.7);
    const x = (seed * INTERNAL_WIDTH + time * (18 + seed * 54)) % INTERNAL_WIDTH;
    const y = seededRandom(node.seed + i * 29.3) * INTERNAL_HEIGHT;
    const glitter = 0.7 + Math.sin(time * 5 + i) * 0.3;
    const size = (1 + seededRandom(node.seed + i * 43.9) * 3) * (0.8 + level * 0.8) * glitter;
    graphic.drawRect(x, y, size, size);
  }
  graphic.endFill();
}

function drawMystify(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const color = hslToHex(fx.hue + 0.72, 0.84, 0.62);
  const points = 5;
  graphic.lineStyle(2, color, 0.22 * level);
  for (let i = 0; i < points; i += 1) {
    const x = INTERNAL_WIDTH * (0.5 + Math.sin(time * (0.32 + i * 0.06) + node.seed + i) * 0.36);
    const y = INTERNAL_HEIGHT * (0.5 + Math.cos(time * (0.27 + i * 0.05) + node.seed + i * 2) * 0.31);
    if (i === 0) graphic.moveTo(x, y);
    else graphic.lineTo(x, y);
  }
}

function drawStatic(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, time, level } = state;
  const voltage = Math.min(150, level * 150 + fx.noise * 18);
  const lineCount = 28;
  const x = node.x * INTERNAL_WIDTH;
  const y = node.y * INTERNAL_HEIGHT;
  graphic.lineStyle(1, 0xffffff, 0.24 * level);
  for (let i = 0; i < lineCount; i += 1) {
    if (seededRandom(node.seed + i + Math.floor(time * 8)) < 0.25) continue;
    const base = (Math.PI * 2 * i) / lineCount;
    const angle = base + Math.sin(time * 5 + i * 1.7) * 0.15 + (seededRandom(node.seed + i * 4.4) - 0.5) * 0.28;
    const inner = 12 + voltage * 0.14;
    const outer = inner + 14 + voltage * 0.12;
    graphic.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    graphic.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
  }
}

function drawPulse(graphic: Graphics, state: ScreensaverRenderState): void {
  const { fx, node, ageSeconds, level } = state;
  const color = hslToHex(fx.hue + 0.9, 0.8, 0.62);
  const radius = 20 + ageSeconds * 72 + level * 74;
  graphic.lineStyle(3, color, 0.2 * level);
  graphic.drawCircle(node.x * INTERNAL_WIDTH, node.y * INTERNAL_HEIGHT, radius);
}

function getImpactHoldLevel(ageSeconds: number, releaseAgeSeconds: number | null): number {
  const impactToHold = 0.5 + Math.max(0, 1 - ageSeconds / 0.18) * 0.5;
  if (releaseAgeSeconds === null) return impactToHold;

  const release = Math.min(1, releaseAgeSeconds / RELEASE_FADE_SECONDS);
  return impactToHold * (1 - easeOutCubic(release));
}

function easeOutCubic(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return 1 - Math.pow(1 - t, 3);
}

function seededRandom(value: number): number {
  return ((Math.sin(value) * 43758.5453) % 1 + 1) % 1;
}

function wrap(value: number, max: number): number {
  return ((value % max) + max) % max;
}
