import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { BurstEvent, GlobalFXState } from "../state/types";
import { hslToHex, lerp } from "../utils/math";

interface BurstSprite {
  graphic: Graphics;
  active: boolean;
  age: number;
  life: number;
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
      this.pool.push({ graphic, active: false, age: 0, life: 0.52, burst: null });
    }
  }

  trigger(burst: BurstEvent): void {
    const sprite = this.pool.find((item) => !item.active) ?? this.pool[0];
    sprite.active = true;
    sprite.age = 0;
    sprite.life = 0.32 + burst.velocity * 0.38;
    sprite.burst = burst;
    sprite.graphic.visible = true;
  }

  update(deltaSeconds: number, fx: GlobalFXState): void {
    for (const sprite of this.pool) {
      if (!sprite.active || !sprite.burst) {
        continue;
      }

      sprite.age += deltaSeconds * fx.speed;
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

    const graphic = sprite.graphic;
    const x = burst.x * INTERNAL_WIDTH;
    const y = burst.y * INTERNAL_HEIGHT;
    const alpha = (1 - progress) * (0.35 + fx.intensity * 0.55);
    const color = hslToHex(fx.hue + burst.id * 0.11, 0.84, 0.58);
    const radius = lerp(24, 180 + burst.velocity * 90, progress);

    graphic.clear();

    if (burst.id === 0) {
      graphic.beginFill(0xffffff, alpha * 0.34);
      graphic.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      graphic.endFill();
      return;
    }

    if (burst.id === 1) {
      graphic.lineStyle(3, color, alpha);
      for (let i = 0; i < 12; i += 1) {
        const angle = (Math.PI * 2 * i) / 12;
        graphic.moveTo(x, y);
        graphic.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      }
      return;
    }

    if (burst.id === 2) {
      graphic.lineStyle(6, color, alpha);
      graphic.drawCircle(x, y, radius);
      graphic.lineStyle(2, 0xffffff, alpha * 0.8);
      graphic.drawCircle(x, y, radius * 0.58);
      return;
    }

    graphic.lineStyle(4, color, alpha);
    for (let i = 0; i < 10; i += 1) {
      const offsetY = (i - 5) * 18;
      const wobble = Math.sin(progress * 24 + i) * (24 + fx.distortion * 60);
      graphic.moveTo(x - radius * 0.7, y + offsetY);
      graphic.lineTo(x + wobble, y + offsetY + 8);
      graphic.lineTo(x + radius * 0.7, y + offsetY - 4);
    }
  }
}
