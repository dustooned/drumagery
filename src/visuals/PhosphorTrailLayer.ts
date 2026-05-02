import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { BurstEvent, GlobalFXState, LoopState } from "../state/types";
import { hslToHex, lerp } from "../utils/math";

interface BurstGhost {
  x: number;
  y: number;
  radius: number;
  hue: number;
  age: number;
  life: number;
}

const MAX_GHOSTS = 42;

export class PhosphorTrailLayer {
  readonly container = new Container();
  private readonly graphic = new Graphics();
  private readonly burstGhosts: BurstGhost[] = [];
  private time = 0;

  constructor() {
    this.container.addChild(this.graphic);
  }

  captureBurst(burst: BurstEvent, fx: GlobalFXState): void {
    const amount = getTrailAmount(fx);
    if (amount <= 0.01) return;

    this.burstGhosts.unshift({
      x: burst.x * INTERNAL_WIDTH,
      y: burst.y * INTERNAL_HEIGHT,
      radius: 38 + burst.velocity * 110 + amount * 32,
      hue: fx.hue + burst.id * 0.11,
      age: 0,
      life: 0.42 + amount * 0.48 + fx.feedback * 0.16
    });

    this.burstGhosts.splice(MAX_GHOSTS);
  }

  update(deltaSeconds: number, fx: GlobalFXState, activeLoops: LoopState[]): void {
    this.time += deltaSeconds * Math.max(0.2, fx.speed);
    const amount = getTrailAmount(fx);
    this.graphic.clear();

    for (const ghost of this.burstGhosts) {
      ghost.age += deltaSeconds * Math.max(0.35, 1.18 - fx.feedback * 0.18);
    }

    while (this.burstGhosts.length > 0 && this.burstGhosts[this.burstGhosts.length - 1].age >= this.burstGhosts[this.burstGhosts.length - 1].life) {
      this.burstGhosts.pop();
    }

    if (amount <= 0.01) return;

    this.drawLoopAfterimages(fx, activeLoops, amount);
    this.drawBurstGhosts(fx, amount);
    this.drawPhosphorScan(fx, amount);
  }

  private drawLoopAfterimages(fx: GlobalFXState, activeLoops: LoopState[], amount: number): void {
    const drift = 18 + amount * 30 + fx.feedback * 10;
    for (const loop of activeLoops) {
      const phase = this.time * (0.36 + loop.id * 0.08) + loop.id * 1.7;
      const alpha = 0.018 + amount * 0.035 + fx.feedback * 0.018;
      const color = hslToHex(fx.hue + loop.id * 0.13, 0.7, 0.5 + amount * 0.08);
      const x = INTERNAL_WIDTH * (0.28 + loop.id * 0.14) + Math.sin(phase) * drift;
      const y = INTERNAL_HEIGHT * (0.42 + Math.cos(phase * 0.75) * 0.11);
      const width = 220 + amount * 120 + fx.scale * 24;
      const height = 70 + loop.id * 18 + amount * 46;

      this.graphic.lineStyle(2 + amount * 4, color, alpha);
      this.graphic.drawEllipse(x, y, width, height);
      this.graphic.lineStyle(1, 0xffffff, alpha * 0.65);
      this.graphic.drawEllipse(x + Math.sin(phase * 1.8) * 14, y, width * 0.68, height * 0.58);
    }
  }

  private drawBurstGhosts(fx: GlobalFXState, amount: number): void {
    for (const ghost of this.burstGhosts) {
      const progress = Math.min(1, ghost.age / ghost.life);
      const alpha = (1 - progress) * (0.06 + amount * 0.13 + fx.feedback * 0.035);
      const radius = lerp(ghost.radius, ghost.radius * (1.7 + amount * 0.35), progress);
      const color = hslToHex(ghost.hue, 0.82, 0.58);

      this.graphic.lineStyle(2 + amount * 4, color, alpha);
      this.graphic.drawCircle(ghost.x, ghost.y, radius);
      this.graphic.lineStyle(1, 0xffffff, alpha * 0.45);
      this.graphic.drawCircle(ghost.x + Math.sin(progress * Math.PI * 6) * amount * 10, ghost.y, radius * 0.62);
    }
  }

  private drawPhosphorScan(fx: GlobalFXState, amount: number): void {
    const rowStep = Math.max(9, 28 - amount * 5 - fx.density * 2);
    const alpha = 0.012 + amount * 0.026 + fx.feedback * 0.01;
    const color = hslToHex(fx.hue + 0.33, 0.48, 0.62);

    this.graphic.lineStyle(1, color, alpha);
    for (let y = (this.time * 18) % rowStep; y <= INTERNAL_HEIGHT; y += rowStep) {
      const wobble = Math.sin(y * 0.018 + this.time * 1.4) * amount * 9;
      this.graphic.moveTo(wobble, y);
      this.graphic.lineTo(INTERNAL_WIDTH + wobble, y);
    }
  }
}

function getTrailAmount(fx: GlobalFXState): number {
  return Math.min(3, Math.max(0, fx.phosphorTrail + fx.feedback * 0.35));
}
