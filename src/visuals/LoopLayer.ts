import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { GlobalFXState, LoopState } from "../state/types";
import { hslToHex } from "../utils/math";
import { responseInt, responseRange, responseValue, visualConfig } from "./visualConfig";

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
    const config = visualConfig.loops.ink;
    const color = hslToHex(fx.hue + 0.02, 0.72, 0.52);
    const count = responseInt(config.density, Math.min(1, fx.density + fx.chaos * 0.18), 3, 13);
    const scale = responseRange(config.scale, fx.scale, 0.7, 1.8 + fx.feedback * 0.4);
    const distortion = responseRange(config.distortion, Math.min(1, fx.distortion + fx.chaos * 0.35), 0, 1);
    for (let i = 0; i < count; i += 1) {
      const drift = Math.sin(this.time * 0.65 + i) * 46 * (1 + distortion);
      const x = INTERNAL_WIDTH * (0.12 + i * (0.76 / Math.max(1, count - 1))) + drift;
      const y = INTERNAL_HEIGHT * 0.5 + Math.cos(this.time * 0.8 + i * 1.4) * 120;
      const radius = (50 + Math.sin(this.time + i) * 18) * scale;
      const alpha =
        responseRange(config.opacity, Math.min(1, fx.intensity + fx.bloom * 0.28), 0.04, 0.18) +
        fx.fade * 0.05 +
        fx.feedback * 0.04;
      this.graphic.beginFill(color, alpha);
      this.graphic.drawCircle(x, y, radius);
      this.graphic.endFill();
    }
  }

  private drawSymbolField(fx: GlobalFXState): void {
    const config = visualConfig.loops.symbols;
    const color = hslToHex(fx.hue + 0.18, 0.8, 0.6);
    this.graphic.lineStyle(2 + fx.bloom * 2, color, responseRange(config.opacity, Math.min(1, fx.intensity + fx.contrast * 0.18), 0.18, 0.68));
    const count = responseInt(config.density, Math.min(1, fx.density + fx.chaos * 0.15), 5, 24);
    const scale = responseRange(config.scale, fx.scale, 0.65, 2);
    for (let i = 0; i < count; i += 1) {
      const x = ((i * 137 + this.time * 38 * (1 + fx.chaos * 0.35)) % (INTERNAL_WIDTH + 160)) - 80;
      const y = 90 + ((i * 67) % (INTERNAL_HEIGHT - 180));
      const size = (14 + ((i % 4) * 5)) * scale;
      this.graphic.drawRect(x - size / 2, y - size / 2, size, size);
      this.graphic.moveTo(x - size, y);
      this.graphic.lineTo(x + size, y);
      this.graphic.moveTo(x, y - size);
      this.graphic.lineTo(x, y + size);
    }
  }

  private drawParallaxBands(fx: GlobalFXState): void {
    const config = visualConfig.loops.bands;
    const color = hslToHex(fx.hue + 0.34, 0.62, 0.52);
    const count = responseInt(config.density, Math.min(1, fx.density + fx.noise * 0.18), 3, 15);
    const height = responseRange(config.scale, fx.scale, 8, 34);
    const distortion = responseRange(config.distortion, Math.min(1, fx.distortion + fx.chaos * 0.4), 0, 1);
    for (let i = 0; i < count; i += 1) {
      const y = 50 + i * (INTERNAL_HEIGHT - 100) / Math.max(1, count - 1) + Math.sin(this.time * 0.8 + i) * 18 * (1 + distortion);
      this.graphic.beginFill(color, responseRange(config.opacity, Math.min(1, fx.intensity + fx.bloom * 0.2), 0.03, 0.15) + fx.fade * 0.03 + fx.feedback * 0.04);
      this.graphic.drawRect(0, y, INTERNAL_WIDTH, height + i * 0.8);
      this.graphic.endFill();
    }
  }

  private drawOrbit(fx: GlobalFXState): void {
    const config = visualConfig.loops.orbit;
    const color = hslToHex(fx.hue + 0.52, 0.76, 0.58);
    this.graphic.lineStyle(3 + fx.bloom * 2, color, responseRange(config.opacity, Math.min(1, fx.intensity + fx.contrast * 0.2), 0.22, 0.74));
    const count = responseInt(config.density, Math.min(1, fx.density + fx.chaos * 0.12), 2, 9);
    const scale = responseRange(config.scale, fx.scale, 0.7, 2.1 + fx.feedback * 0.4);
    const distortion = responseRange(config.distortion, Math.min(1, fx.distortion + fx.chaos * 0.35), 0, 1);
    for (let i = 0; i < count; i += 1) {
      const radiusX = (90 + i * 45 + distortion * 40) * scale;
      const radiusY = (30 + i * 22) * scale;
      const x = INTERNAL_WIDTH * 0.5;
      const y = INTERNAL_HEIGHT * 0.52;
      this.graphic.drawEllipse(x, y, radiusX, radiusY);
      const angle = this.time * (0.7 + i * 0.08) + i;
      this.graphic.beginFill(color, responseValue(config.opacity, fx.fade) * 0.32);
      this.graphic.drawCircle(x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY, (7 + i) * scale);
      this.graphic.endFill();
    }
  }
}
