import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { GlobalFXState, LoopState } from "../state/types";
import { hslToHex } from "../utils/math";
import type { ImageSequenceSlot } from "./imageSequenceManifest";

export class ImageSequenceLoopLayer {
  readonly container = new Container();
  private readonly placeholder = new Graphics();
  private readonly frames: Sprite[] = [];
  private time = 0;
  private activeFrameIndex = -1;

  constructor(
    private readonly loop: LoopState,
    private readonly slot: ImageSequenceSlot
  ) {
    this.container.addChild(this.placeholder);
    this.createFrameSprites();
  }

  update(deltaSeconds: number, fx: GlobalFXState): void {
    this.time += deltaSeconds * fx.speed;

    if (this.frames.length === 0) {
      this.drawPlaceholder(fx);
      return;
    }

    this.placeholder.clear();
    this.updateFrameSprite(fx);
  }

  private createFrameSprites(): void {
    for (const path of this.slot.framePaths) {
      const sprite = new Sprite(Texture.from(path));
      sprite.anchor.set(this.slot.anchorX, this.slot.anchorY);
      sprite.x = INTERNAL_WIDTH * 0.5;
      sprite.y = INTERNAL_HEIGHT * 0.5;
      sprite.visible = false;
      this.container.addChild(sprite);
      this.frames.push(sprite);
    }
  }

  private updateFrameSprite(fx: GlobalFXState): void {
    const frameIndex = Math.floor(this.time * this.slot.fps) % this.frames.length;
    if (frameIndex !== this.activeFrameIndex) {
      if (this.activeFrameIndex >= 0) {
        this.frames[this.activeFrameIndex].visible = false;
      }
      this.frames[frameIndex].visible = true;
      this.activeFrameIndex = frameIndex;
    }

    const sprite = this.frames[frameIndex];
    const scale = this.slot.baseScale * (0.72 + fx.scale * 0.36 + Math.max(0, fx.intensity - 1) * 0.18);
    sprite.scale.set(scale);
    sprite.alpha = Math.min(1, 0.44 + fx.intensity * 0.32 + fx.fade * 0.12);
    sprite.rotation = Math.sin(this.time * 0.35 + this.loop.id) * fx.distortion * 0.02;
  }

  private drawPlaceholder(fx: GlobalFXState): void {
    const overdrive = Math.min(1, Math.max(0, fx.intensity - 1, fx.bloom - 1, fx.chaos - 1) / 2);
    const color = hslToHex(fx.hue + this.slot.hueOffset + overdrive * 0.04, 0.78, 0.56 + overdrive * 0.1);
    const x = INTERNAL_WIDTH * 0.5;
    const y = INTERNAL_HEIGHT * 0.5;
    const scale = this.slot.baseScale * (0.78 + fx.scale * 0.34 + overdrive * 0.38);
    const radius = (70 + this.loop.id * 18 + Math.sin(this.time * 1.3) * 10) * scale;
    const spokes = 6 + this.loop.id * 2 + Math.round(Math.min(1, fx.density / 3 + fx.chaos * 0.18) * 8);
    const alpha = Math.min(0.9, 0.18 + fx.intensity * 0.22 + fx.bloom * 0.1 + overdrive * 0.18);
    const wobble = 1 + fx.distortion * 0.2 + fx.chaos * 0.18;

    this.placeholder.clear();
    this.placeholder.lineStyle(3 + fx.bloom * 2 + overdrive * 5, color, alpha);
    this.placeholder.drawCircle(x, y, radius);

    for (let i = 0; i < spokes; i += 1) {
      const angle = (Math.PI * 2 * i) / spokes + this.time * (0.18 + this.loop.id * 0.04);
      const inner = radius * (0.34 + Math.sin(this.time + i) * 0.04);
      const outer = radius * (0.88 + Math.cos(this.time * 0.9 + i) * 0.12 * wobble);
      this.placeholder.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
      this.placeholder.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    }

    this.placeholder.beginFill(color, alpha * 0.28);
    this.placeholder.drawCircle(x, y, radius * 0.24);
    this.placeholder.endFill();
  }
}
