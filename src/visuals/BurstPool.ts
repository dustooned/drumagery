import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { BurstEvent, BurstHoldState, GlobalFXState } from "../state/types";
import { hslToHex, lerp } from "../utils/math";
import { responseInt, responseRange, visualConfig } from "./visualConfig";

interface BurstSprite {
  graphic: Graphics;
  active: boolean;
  age: number;
  life: number;
  attack: number;
  burst: BurstEvent | null;
}

const POOL_SIZE = 32;

export class BurstPool {
  readonly container = new Container();
  private readonly holdGraphic = new Graphics();
  private readonly pool: BurstSprite[] = [];
  private activeHolds: BurstHoldState[] = [];

  constructor() {
    this.container.addChild(this.holdGraphic);
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const graphic = new Graphics();
      graphic.visible = false;
      this.container.addChild(graphic);
      this.pool.push({ graphic, active: false, age: 0, life: 0.52, attack: 0.16, burst: null });
    }
  }

  syncHeldBursts(holds: BurstHoldState[]): void {
    this.activeHolds = holds.map((hold) => ({ ...hold }));
  }

  trigger(burst: BurstEvent): void {
    const config = visualConfig.bursts;
    const sprite = this.pool.find((item) => !item.active) ?? this.pool[0];
    sprite.active = true;
    sprite.age = 0;
    sprite.life = responseRange(config.lifetime, burst.velocity, 0.28, 0.72);
    sprite.attack = responseRange(config.attack, 1 - burst.velocity, 0.08, 0.28);
    sprite.burst = burst;
    sprite.graphic.visible = true;
  }

  update(deltaSeconds: number, fx: GlobalFXState): void {
    this.drawHeldBursts(fx);

    for (const sprite of this.pool) {
      if (!sprite.active || !sprite.burst) {
        continue;
      }

      sprite.age += deltaSeconds * fx.speed * (1.45 - fx.fade * 0.65 - fx.feedback * 0.35);
      const progress = sprite.age / sprite.life;

      if (progress >= 1) {
        sprite.active = false;
        sprite.burst = null;
        sprite.graphic.clear();
        sprite.graphic.visible = false;
        continue;
      }

      this.drawBurst(sprite, fx, progress);
    }
  }

  private drawHeldBursts(fx: GlobalFXState): void {
    const now = performance.now();
    const releaseFadeMs = 400;

    this.holdGraphic.clear();

    for (const hold of this.activeHolds) {
      const releaseAge = hold.releasedAt === null ? 0 : now - hold.releasedAt;
      if (hold.releasedAt !== null && releaseAge > releaseFadeMs) continue;

      const ageSeconds = (now - hold.startedAt) / 1000;
      const impact = Math.max(0, 1 - ageSeconds / 0.24);
      const holdLevel = hold.releasedAt === null ? 0.5 + impact * 0.5 : 0;
      const releaseFade = hold.releasedAt === null ? 1 : 1 - easeOutCubic(releaseAge / releaseFadeMs);
      const force = (0.42 + hold.velocity * 0.5 + fx.burstPower * 0.08) * releaseFade;
      const x = hold.x * INTERNAL_WIDTH;
      const y = hold.y * INTERNAL_HEIGHT;
      const color = hslToHex(fx.hue + hold.id * 0.11, 0.82, 0.58);
      const alpha = (0.2 + holdLevel * 0.22 + fx.intensity * 0.08) * force;
      const baseRadius = 44 + holdLevel * 58 + Math.sin(ageSeconds * 8) * 4;

      if (hold.id === 3) {
        this.holdGraphic.lineStyle(5 + fx.bloom * 2, color, alpha);
        const stretchX = 96 + holdLevel * 180;
        const rows = 5;
        for (let i = 0; i < rows; i += 1) {
          const offsetY = (i - 2) * 18;
          const wobble = Math.sin(ageSeconds * 14 + i * 1.4) * (16 + fx.distortion * 36);
          this.holdGraphic.moveTo(x - stretchX, y + offsetY);
          this.holdGraphic.lineTo(x + wobble, y + offsetY + 7);
          this.holdGraphic.lineTo(x + stretchX, y + offsetY - 5);
        }
        continue;
      }

      if (hold.id === 1) {
        const points = 10;
        this.holdGraphic.lineStyle(3 + fx.bloom * 2, color, alpha);
        for (let i = 0; i < points; i += 1) {
          const angle = (Math.PI * 2 * i) / points + ageSeconds * 0.8;
          const inner = baseRadius * 0.28;
          const outer = baseRadius * (0.85 + Math.sin(ageSeconds * 5 + i) * 0.12);
          this.holdGraphic.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
          this.holdGraphic.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        }
        continue;
      }

      if (hold.id === 2) {
        this.holdGraphic.lineStyle(4 + fx.bloom * 2, color, alpha);
        this.holdGraphic.drawCircle(x, y, baseRadius);
        this.holdGraphic.lineStyle(1, 0xffffff, alpha * 0.7);
        this.holdGraphic.drawCircle(x, y, baseRadius * 0.58);
        continue;
      }

      this.holdGraphic.beginFill(0xffffff, alpha * 0.12);
      this.holdGraphic.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      this.holdGraphic.endFill();
    }
  }

  private drawBurst(sprite: BurstSprite, fx: GlobalFXState, progress: number): void {
    const burst = sprite.burst;
    if (!burst) return;

    const config = visualConfig.bursts;
    const graphic = sprite.graphic;
    const x = burst.x * INTERNAL_WIDTH;
    const y = burst.y * INTERNAL_HEIGHT;
    const overdrive = getOverdrive(fx);
    const attackProgress = Math.min(1, progress / sprite.attack);
    const envelope = easeOutCubic(attackProgress) * (1 - progress);
    const force = responseRange(config.force, Math.min(1, fx.burstPower / 3 + fx.chaos * 0.22), 0.45, 2.15 + overdrive * 2.4) + burst.velocity * 0.55;
    const alpha =
      envelope *
      (responseRange(config.alpha, Math.min(1, fx.intensity + fx.bloom * 0.3), 0.24, 0.82) +
        fx.burstPower * 0.18 +
        fx.contrast * 0.08 +
        overdrive * 0.16);
    const color = hslToHex(fx.hue + burst.id * 0.11 + overdrive * 0.04, 0.84, 0.58 + overdrive * 0.12);
    const radius = lerp(10 + burst.velocity * 24, (120 + burst.velocity * 165) * force, easeOutCubic(progress));

    graphic.clear();

    if (burst.id === 0) {
      graphic.beginFill(0xffffff, alpha * 0.34);
      graphic.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      graphic.endFill();
      return;
    }

    if (burst.id === 1) {
      graphic.lineStyle(3 + fx.bloom * 3 + overdrive * 6, color, alpha);
      const rays = responseInt(config.detail, Math.min(1, fx.density / 3 + fx.chaos * 0.18), 6, 24 + Math.round(overdrive * 20));
      for (let i = 0; i < rays; i += 1) {
        const angle = (Math.PI * 2 * i) / rays;
        graphic.moveTo(x, y);
        graphic.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      }
      return;
    }

    if (burst.id === 2) {
      graphic.lineStyle(6 + fx.bloom * 4 + overdrive * 8, color, alpha);
      graphic.drawCircle(x, y, radius);
      graphic.lineStyle(2, 0xffffff, alpha * 0.8);
      graphic.drawCircle(x, y, radius * 0.58);
      return;
    }

    graphic.lineStyle(4 + fx.bloom * 3 + overdrive * 8, color, alpha);
    const slices = responseInt(config.detail, Math.min(1, fx.density / 3 + fx.noise * 0.18), 4, 18 + Math.round(overdrive * 20));
    const distortion = responseRange(config.distortion, Math.min(1, fx.distortion / 3 + fx.chaos * 0.42), 0, 1 + overdrive * 3);
    for (let i = 0; i < slices; i += 1) {
      const offsetY = (i - 5) * 18;
      const wobble = Math.sin(progress * 24 + i) * (24 + distortion * 60);
      graphic.moveTo(x - radius * 0.7, y + offsetY);
      graphic.lineTo(x + wobble, y + offsetY + 8);
      graphic.lineTo(x + radius * 0.7, y + offsetY - 4);
    }

    const split = 10 + fx.chromaShift * 36 + burst.velocity * 18;
    graphic.lineStyle(2 + fx.syncTear * 4 + overdrive * 5, 0xff4fd8, alpha * 0.62);
    for (let i = 0; i < slices; i += 2) {
      const offsetY = (i - 5) * 18 + Math.sin(progress * 18 + i) * 8;
      graphic.moveTo(x - radius * 0.58 - split, y + offsetY);
      graphic.lineTo(x + radius * 0.58 - split, y + offsetY - 6);
    }
    graphic.lineStyle(2 + fx.syncTear * 4 + overdrive * 5, 0x41f7ff, alpha * 0.56);
    for (let i = 1; i < slices; i += 2) {
      const offsetY = (i - 5) * 18 + Math.cos(progress * 20 + i) * 8;
      graphic.moveTo(x - radius * 0.52 + split, y + offsetY + 5);
      graphic.lineTo(x + radius * 0.52 + split, y + offsetY);
    }
  }
}

function easeOutCubic(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return 1 - Math.pow(1 - t, 3);
}

function getOverdrive(fx: GlobalFXState): number {
  return Math.min(1, Math.max(0, fx.intensity - 1, fx.bloom - 1, fx.burstPower - 1, fx.density - 1, fx.chaos - 1) / 2);
}
