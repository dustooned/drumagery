import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { GlobalFXState, ScreensaverNodeState, ScreensaverNodeType } from "../state/types";
import { hslToHex } from "../utils/math";

interface ScreensaverNode {
  id: ScreensaverNodeType;
  label: string;
  update(dt: number, state: ScreensaverRenderState): void;
  render(container: Graphics, state: ScreensaverRenderState): void;
}

interface ScreensaverRenderState {
  node: ScreensaverNodeState;
  fx: GlobalFXState;
  ageSeconds: number;
  time: number;
}

export class ScreensaverNodeLayer {
  readonly container = new Container();
  private readonly graphic = new Graphics();
  private readonly renderers: Record<ScreensaverNodeType, ScreensaverNode>;
  private activeNodes: ScreensaverNodeState[] = [];
  private time = 0;

  constructor() {
    this.renderers = {
      "bouncing-shape": new BouncingShapeNode(),
      starfield: new StarfieldNode()
    };
    this.container.addChild(this.graphic);
  }

  syncNodes(nodes: ScreensaverNodeState[]): void {
    this.activeNodes = nodes.map((node) => ({ ...node }));
  }

  update(deltaSeconds: number, fx: GlobalFXState): void {
    this.time += deltaSeconds * Math.max(0.2, fx.speed);
    this.graphic.clear();

    for (const node of this.activeNodes) {
      const ageMs = performance.now() - node.triggeredAt;
      const state: ScreensaverRenderState = {
        node,
        fx,
        ageSeconds: ageMs / 1000,
        time: this.time
      };
      const renderer = this.renderers[node.type];
      renderer.update(deltaSeconds, state);
      renderer.render(this.graphic, state);
    }
  }
}

class BouncingShapeNode implements ScreensaverNode {
  readonly id = "bouncing-shape";
  readonly label = "Bouncing shape";

  update(): void {
    // Motion is deterministic from node trigger time and global FX.
  }

  render(graphic: Graphics, state: ScreensaverRenderState): void {
    const { node, fx, ageSeconds, time } = state;
    const fade = getNodeFade(ageSeconds);
    const overdrive = getOverdrive(fx);
    const radius = 24 + fx.scale * 22 + node.velocity * 34 + overdrive * 34;
    const speed = 0.55 + fx.speed * 0.12 + node.velocity * 0.18;
    const spanX = INTERNAL_WIDTH * (0.28 + fx.scale * 0.045);
    const spanY = INTERNAL_HEIGHT * (0.2 + fx.scale * 0.03);
    const phase = time * speed + node.seed;
    const x = INTERNAL_WIDTH * node.x + Math.sin(phase) * spanX;
    const y = INTERNAL_HEIGHT * node.y + Math.cos(phase * 1.31) * spanY;
    const color = hslToHex(fx.hue + node.id * 0.12 + overdrive * 0.04, 0.78, 0.56 + overdrive * 0.12);
    const alpha = fade * (0.18 + fx.intensity * 0.16 + fx.bloom * 0.08 + overdrive * 0.12);
    const sides = 3 + ((node.id + Math.round(fx.density)) % 5);
    const distortion = Math.min(1, fx.distortion / 3 + fx.chaos * 0.18);

    graphic.lineStyle(2 + fx.bloom * 2 + overdrive * 4, color, alpha);
    for (let i = 0; i < sides; i += 1) {
      const angleA = phase * 0.37 + (Math.PI * 2 * i) / sides;
      const angleB = phase * 0.37 + (Math.PI * 2 * (i + 1)) / sides;
      const radiusA = radius * (1 + Math.sin(time + i) * 0.12 * distortion);
      const radiusB = radius * (1 + Math.cos(time * 0.8 + i) * 0.12 * distortion);
      const ax = x + Math.cos(angleA) * radiusA;
      const ay = y + Math.sin(angleA) * radiusA;
      const bx = x + Math.cos(angleB) * radiusB;
      const by = y + Math.sin(angleB) * radiusB;
      if (i === 0) {
        graphic.moveTo(ax, ay);
      }
      graphic.lineTo(bx, by);
    }

    graphic.beginFill(color, alpha * 0.16);
    graphic.drawCircle(x, y, radius * 0.42);
    graphic.endFill();
  }
}

class StarfieldNode implements ScreensaverNode {
  readonly id = "starfield";
  readonly label = "Starfield";

  update(): void {
    // Star positions are seeded by node id and age to avoid per-frame allocation.
  }

  render(graphic: Graphics, state: ScreensaverRenderState): void {
    const { node, fx, ageSeconds, time } = state;
    const fade = getNodeFade(ageSeconds);
    const overdrive = getOverdrive(fx);
    const count = Math.round(28 + Math.min(1, fx.density / 3 + fx.chaos * 0.12) * 84 + overdrive * 52);
    const color = hslToHex(fx.hue + 0.52 + node.id * 0.07, 0.68, 0.64 + overdrive * 0.1);
    const alpha = fade * (0.12 + fx.intensity * 0.1 + fx.contrast * 0.06 + overdrive * 0.12);
    const drift = time * (26 + fx.speed * 13 + node.velocity * 22);

    graphic.beginFill(color, alpha);
    for (let i = 0; i < count; i += 1) {
      const seedA = seededRandom(node.seed + i * 11.7);
      const seedB = seededRandom(node.seed + i * 29.3);
      const seedC = seededRandom(node.seed + i * 43.9);
      const x = (seedA * INTERNAL_WIDTH + drift * (0.25 + seedC) + node.x * 80) % INTERNAL_WIDTH;
      const y = (seedB * INTERNAL_HEIGHT + Math.sin(time * 0.4 + seedC * 9) * fx.distortion * 6 + node.y * 40) % INTERNAL_HEIGHT;
      const size = 1 + seedC * (2 + fx.pixelate * 2 + overdrive * 3);
      graphic.drawRect(x, y, size, size);
    }
    graphic.endFill();
  }
}

function getNodeFade(ageSeconds: number): number {
  const fadeIn = Math.min(1, ageSeconds / 0.8);
  const pulse = 0.42 + Math.max(0, 1 - ageSeconds / 7) * 0.58;
  return fadeIn * pulse;
}

function seededRandom(value: number): number {
  return ((Math.sin(value) * 43758.5453) % 1 + 1) % 1;
}

function getOverdrive(fx: GlobalFXState): number {
  return Math.min(1, Math.max(0, fx.intensity - 1, fx.bloom - 1, fx.density - 1, fx.chaos - 1, fx.scale - 1) / 2);
}
