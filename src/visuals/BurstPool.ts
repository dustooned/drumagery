import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { BurstEvent, GlobalFXState } from "../state/types";
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
  private readonly pool: BurstSprite[] = [];

  constructor() {
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const graphic = new Graphics();
      graphic.visible = false;
      this.container.addChild(graphic);
      this.pool.push({ graphic, active: false, age: 0, life: 0.52, attack: 0.16, burst: null });
    }
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
  }
}

function easeOutCubic(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return 1 - Math.pow(1 - t, 3);
}

function getOverdrive(fx: GlobalFXState): number {
  return Math.min(1, Math.max(0, fx.intensity - 1, fx.bloom - 1, fx.burstPower - 1, fx.density - 1, fx.chaos - 1) / 2);
}
