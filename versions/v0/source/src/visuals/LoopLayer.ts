import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { GlobalFXState, LoopState } from "../state/types";
import { hslToHex } from "../utils/math";

export class LoopLayer {
  readonly container = new Container();
  private readonly graphic = new Graphics();
  private time = 0;

  constructor(private readonly loop: LoopState) {
    this.container.addChild(this.graphic);
  }

  update(deltaSeconds: number, fx: GlobalFXState): void {
    this.time += deltaSeconds * fx.speed;
    this.graphic.clear();

    if (this.loop.id === 0) {
      this.drawInk(fx);
    } else if (this.loop.id === 1) {
      this.drawSymbolField(fx);
    } else if (this.loop.id === 2) {
      this.drawParallaxBands(fx);
    } else {
      this.drawOrbit(fx);
    }
  }

  private drawInk(fx: GlobalFXState): void {
    const color = hslToHex(fx.hue + 0.02, 0.72, 0.52);
    for (let i = 0; i < 7; i += 1) {
      const drift = Math.sin(this.time * 0.65 + i) * 46 * (1 + fx.distortion);
      const x = INTERNAL_WIDTH * (0.16 + i * 0.115) + drift;
      const y = INTERNAL_HEIGHT * 0.5 + Math.cos(this.time * 0.8 + i * 1.4) * 120;
      const radius = 70 + Math.sin(this.time + i) * 24;
      this.graphic.beginFill(color, 0.08 + fx.intensity * 0.12);
      this.graphic.drawCircle(x, y, radius);
      this.graphic.endFill();
    }
  }

  private drawSymbolField(fx: GlobalFXState): void {
    const color = hslToHex(fx.hue + 0.18, 0.8, 0.6);
    this.graphic.lineStyle(2, color, 0.22 + fx.intensity * 0.28);
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 137 + this.time * 38) % (INTERNAL_WIDTH + 160)) - 80;
      const y = 90 + ((i * 67) % (INTERNAL_HEIGHT - 180));
      const size = 18 + ((i % 4) * 6);
      this.graphic.drawRect(x - size / 2, y - size / 2, size, size);
      this.graphic.moveTo(x - size, y);
      this.graphic.lineTo(x + size, y);
      this.graphic.moveTo(x, y - size);
      this.graphic.lineTo(x, y + size);
    }
  }

  private drawParallaxBands(fx: GlobalFXState): void {
    const color = hslToHex(fx.hue + 0.34, 0.62, 0.52);
    for (let i = 0; i < 8; i += 1) {
      const y = 82 + i * 82 + Math.sin(this.time * 0.8 + i) * 18 * (1 + fx.distortion);
      this.graphic.beginFill(color, 0.05 + fx.intensity * 0.08);
      this.graphic.drawRect(0, y, INTERNAL_WIDTH, 12 + i * 2);
      this.graphic.endFill();
    }
  }

  private drawOrbit(fx: GlobalFXState): void {
    const color = hslToHex(fx.hue + 0.52, 0.76, 0.58);
    this.graphic.lineStyle(3, color, 0.28 + fx.intensity * 0.32);
    for (let i = 0; i < 5; i += 1) {
      const radiusX = 120 + i * 58 + fx.distortion * 40;
      const radiusY = 40 + i * 28;
      const x = INTERNAL_WIDTH * 0.5;
      const y = INTERNAL_HEIGHT * 0.52;
      this.graphic.drawEllipse(x, y, radiusX, radiusY);
      const angle = this.time * (0.7 + i * 0.08) + i;
      this.graphic.beginFill(color, 0.3);
      this.graphic.drawCircle(x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY, 9 + i);
      this.graphic.endFill();
    }
  }
}
