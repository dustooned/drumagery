import { BLEND_MODES, Container, Graphics, Sprite, Texture } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { GlobalFXState, LoopState } from "../state/types";
import { hslToHex } from "../utils/math";
import type { ImageSequenceSlot, SequenceBlendMode, TemporalMode } from "./imageSequenceManifest";

export class ImageSequenceLoopLayer {
  readonly container = new Container();
  private readonly placeholder = new Graphics();
  private readonly frameTextures: Texture[] = [];
  private readonly tileSprites: Sprite[] = [];
  private time = 0;
  private currentTileCount = 0;

  constructor(
    private readonly loop: LoopState,
    private readonly slot: ImageSequenceSlot
  ) {
    this.placeholder.blendMode = getPixiBlendMode(this.slot.blendMode);
    this.container.addChild(this.placeholder);
    this.createFrameSprites();
  }

  update(deltaSeconds: number, fx: GlobalFXState): void {
    this.time += deltaSeconds * fx.speed;
    const gridSize = getGridSizeFromDensity(fx.density, isMobileRuntime());

    if (this.frameTextures.length === 0) {
      this.hideTileSprites();
      this.drawPlaceholderGrid(fx, gridSize);
      return;
    }

    this.placeholder.clear();
    this.updateImageGrid(fx, gridSize);
  }

  private createFrameSprites(): void {
    for (const path of this.slot.framePaths) {
      this.frameTextures.push(Texture.from(path));
    }
  }

  private updateImageGrid(fx: GlobalFXState, gridSize: number): void {
    const rows = gridSize;
    const cols = gridSize;
    const totalTiles = rows * cols;
    const totalFrames = Math.max(1, this.frameTextures.length);
    const globalFrame = Math.floor(this.time * this.slot.fps);
    const temporalOffset = getTemporalOffset(fx);
    const tileWidth = INTERNAL_WIDTH / cols;
    const tileHeight = INTERNAL_HEIGHT / rows;
    const spread = getTileSpread(fx, Math.min(tileWidth, tileHeight));

    this.ensureTileSprites(totalTiles);

    for (let index = 0; index < this.tileSprites.length; index += 1) {
      const sprite = this.tileSprites[index];
      if (index >= totalTiles) {
        sprite.visible = false;
        continue;
      }

      const col = index % cols;
      const row = Math.floor(index / cols);
      const frameIndex = getTileFrameIndex(
        globalFrame,
        index,
        rows,
        cols,
        totalFrames,
        temporalOffset,
        this.slot.temporalMode,
        this.slot.playbackMode
      );
      const jitter = getTileJitter(index, this.loop.id, this.time, spread);
      const scale = this.slot.baseScale * (0.72 + fx.scale * 0.12 + Math.max(0, fx.intensity - 1) * 0.08);
      const maxWidth = tileWidth * (0.92 + fx.scale * 0.03);
      const maxHeight = tileHeight * (0.92 + fx.scale * 0.03);
      const texture = this.frameTextures[frameIndex] ?? Texture.EMPTY;

      sprite.texture = texture;
      sprite.blendMode = getPixiBlendMode(this.slot.blendMode);
      sprite.anchor.set(this.slot.anchorX, this.slot.anchorY);
      sprite.x = col * tileWidth + tileWidth * 0.5 + jitter.x;
      sprite.y = row * tileHeight + tileHeight * 0.5 + jitter.y;
      sprite.width = maxWidth * scale;
      sprite.height = maxHeight * scale;
      sprite.alpha = Math.min(1, 0.42 + fx.intensity * 0.22 + fx.fade * 0.1);
      sprite.rotation = jitter.rotation + Math.sin(this.time * 0.35 + this.loop.id + index * 0.17) * fx.distortion * 0.006;
      sprite.visible = true;
    }
  }

  private ensureTileSprites(totalTiles: number): void {
    if (this.currentTileCount === totalTiles && this.tileSprites.length >= totalTiles) return;

    while (this.tileSprites.length < totalTiles) {
      const sprite = new Sprite(this.frameTextures[0] ?? Texture.EMPTY);
      sprite.visible = false;
      this.container.addChild(sprite);
      this.tileSprites.push(sprite);
    }

    this.currentTileCount = totalTiles;
  }

  private hideTileSprites(): void {
    for (const sprite of this.tileSprites) {
      sprite.visible = false;
    }
  }

  private drawPlaceholderGrid(fx: GlobalFXState, gridSize: number): void {
    const overdrive = Math.min(1, Math.max(0, fx.intensity - 1, fx.bloom - 1, fx.chaos - 1) / 2);
    const color = hslToHex(fx.hue + this.slot.hueOffset + overdrive * 0.04, 0.78, 0.56 + overdrive * 0.1);
    const rows = gridSize;
    const cols = gridSize;
    const totalTiles = rows * cols;
    const totalFrames = this.slot.expectedFrameCount;
    const globalFrame = Math.floor(this.time * this.slot.fps);
    const temporalOffset = getTemporalOffset(fx);
    const tileWidth = INTERNAL_WIDTH / cols;
    const tileHeight = INTERNAL_HEIGHT / rows;
    const spread = getTileSpread(fx, Math.min(tileWidth, tileHeight));
    const scale = this.slot.baseScale * (0.7 + fx.scale * 0.12 + overdrive * 0.18);
    const radiusBase = Math.min(tileWidth, tileHeight) * (0.16 + this.loop.id * 0.015) * scale;
    const spokes = 4 + this.loop.id + Math.round(Math.min(1, fx.density / 3 + fx.chaos * 0.18) * 5);
    const alpha = Math.min(0.9, 0.18 + fx.intensity * 0.22 + fx.bloom * 0.1 + overdrive * 0.18);
    const wobble = 1 + fx.distortion * 0.2 + fx.chaos * 0.18;

    this.placeholder.clear();

    for (let index = 0; index < totalTiles; index += 1) {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const frameIndex = getTileFrameIndex(
        globalFrame,
        index,
        rows,
        cols,
        totalFrames,
        temporalOffset,
        this.slot.temporalMode,
        this.slot.playbackMode
      );
      const framePhase = (frameIndex / totalFrames) * Math.PI * 2;
      const jitter = getTileJitter(index, this.loop.id, this.time, spread);
      const x = col * tileWidth + tileWidth * 0.5 + jitter.x;
      const y = row * tileHeight + tileHeight * 0.5 + jitter.y;
      const radius = radiusBase * (0.82 + Math.sin(framePhase) * 0.14);

      this.placeholder.lineStyle(1, color, alpha * 0.16);
      this.placeholder.drawRect(col * tileWidth, row * tileHeight, tileWidth, tileHeight);

      this.placeholder.lineStyle(2 + fx.bloom + overdrive * 3, color, alpha);
      this.placeholder.drawCircle(x, y, radius);

      for (let i = 0; i < spokes; i += 1) {
        const angle = (Math.PI * 2 * i) / spokes + framePhase + this.time * (0.08 + this.loop.id * 0.02);
        const inner = radius * (0.32 + Math.sin(framePhase + i) * 0.04);
        const outer = radius * (0.88 + Math.cos(framePhase * 0.9 + i) * 0.12 * wobble);
        this.placeholder.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        this.placeholder.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
      }

      this.placeholder.beginFill(color, alpha * 0.2);
      this.placeholder.drawCircle(x, y, radius * 0.24);
      this.placeholder.endFill();
    }
  }
}

function getPixiBlendMode(mode: SequenceBlendMode): BLEND_MODES {
  if (mode === "add") return BLEND_MODES.ADD;
  if (mode === "multiply") return BLEND_MODES.MULTIPLY;
  if (mode === "screen") return BLEND_MODES.SCREEN;
  return BLEND_MODES.NORMAL;
}

function getGridSizeFromDensity(density: number, isMobile: boolean): number {
  const normalized = Math.min(1, Math.max(0, density / 3));
  const maxGrid = isMobile ? 6 : 8;
  let size = 1;

  if (normalized >= 0.2) size = 2;
  if (normalized >= 0.4) size = 4;
  if (normalized >= 0.7) size = 6;
  if (normalized >= 0.92) size = 8;

  return Math.min(size, maxGrid);
}

function getTemporalOffset(fx: GlobalFXState): number {
  return Math.min(0.9, Math.max(0, fx.chaos / 3) * 0.9);
}

function getTileFrameIndex(
  globalFrame: number,
  tileIndex: number,
  rows: number,
  cols: number,
  totalFrames: number,
  temporalOffset: number,
  mode: TemporalMode,
  playbackMode: "loop" | "ping-pong"
): number {
  const offsetFrames = Math.floor(getTileOffsetRatio(tileIndex, rows, cols, mode) * temporalOffset * totalFrames);
  return getPlaybackFrame(globalFrame - offsetFrames, totalFrames, playbackMode);
}

function getPlaybackFrame(frame: number, totalFrames: number, playbackMode: "loop" | "ping-pong"): number {
  if (totalFrames <= 1) return 0;

  if (playbackMode === "ping-pong") {
    const period = totalFrames * 2 - 2;
    const wrapped = ((frame % period) + period) % period;
    return wrapped < totalFrames ? wrapped : period - wrapped;
  }

  return ((frame % totalFrames) + totalFrames) % totalFrames;
}

function getTileOffsetRatio(tileIndex: number, rows: number, cols: number, mode: TemporalMode): number {
  const totalTiles = rows * cols;
  if (mode === "uniform" || totalTiles <= 1) {
    return 0;
  }

  if (mode === "randomized") {
    return seededTileRandom(tileIndex);
  }

  const col = tileIndex % cols;
  const row = Math.floor(tileIndex / cols);

  if (mode === "wave") {
    const centerX = (cols - 1) * 0.5;
    const centerY = (rows - 1) * 0.5;
    const maxDistance = Math.hypot(centerX, centerY) || 1;
    return Math.hypot(col - centerX, row - centerY) / maxDistance;
  }

  return tileIndex / Math.max(1, totalTiles - 1);
}

function seededTileRandom(tileIndex: number): number {
  return ((Math.sin(tileIndex * 91.17 + 13.31) * 43758.5453) % 1 + 1) % 1;
}

function getTileSpread(fx: GlobalFXState, tileSize: number): number {
  return Math.min(tileSize * 0.18, Math.max(0, fx.distortion / 3 + fx.chaos * 0.08) * tileSize * 0.18);
}

function getTileJitter(tileIndex: number, loopId: number, time: number, spread: number): { x: number; y: number; rotation: number } {
  if (spread <= 0.01) {
    return { x: 0, y: 0, rotation: 0 };
  }

  const phase = time * 0.9 + tileIndex * 1.73 + loopId * 2.1;
  return {
    x: Math.sin(phase) * spread,
    y: Math.cos(phase * 0.83) * spread,
    rotation: Math.sin(phase * 0.67) * spread * 0.002
  };
}

function isMobileRuntime(): boolean {
  return navigator.maxTouchPoints > 1 && window.matchMedia("(max-width: 900px)").matches;
}
