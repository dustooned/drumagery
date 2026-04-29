import { Container, Graphics, Rectangle } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import { createDefaultGlobalFX, FX_CONTROLS } from "../state/fxConfig";
import type { BurstEvent, GlobalFXState, InstrumentState } from "../state/types";
import { hslToHex, lerp } from "../utils/math";
import { BurstPool } from "./BurstPool";
import { LoopLayer } from "./LoopLayer";
import { PixelateFilter } from "./PixelateFilter";
import { SyncTearFilter } from "./SyncTearFilter";
import { responseRange, visualConfig } from "./visualConfig";

export class VisualEngine {
  private readonly background = new Graphics();
  private readonly noiseLayer = new Graphics();
  private readonly loopContainer = new Container();
  private readonly burstPool = new BurstPool();
  private readonly syncTearFilter = new SyncTearFilter();
  private readonly pixelateFilter = new PixelateFilter();
  private readonly loopLayers = new Map<number, LoopLayer>();
  private state: InstrumentState | null = null;
  private readonly smoothedFX: GlobalFXState = createDefaultGlobalFX();

  constructor(private readonly stage: Container) {
    this.stage.filters = [this.syncTearFilter, this.pixelateFilter];
    this.stage.filterArea = new Rectangle(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.stage.addChild(this.background);
    this.stage.addChild(this.loopContainer);
    this.stage.addChild(this.burstPool.container);
    this.stage.addChild(this.noiseLayer);
  }

  syncState(state: InstrumentState): void {
    this.state = state;
    const activeIds = new Set(state.activeLoops.map((loop) => loop.id));

    for (const [loopId, layer] of this.loopLayers) {
      if (!activeIds.has(loopId)) {
        this.loopContainer.removeChild(layer.container);
        this.loopLayers.delete(loopId);
      }
    }

    for (const loop of state.activeLoops) {
      if (!this.loopLayers.has(loop.id)) {
        const layer = new LoopLayer(loop);
        this.loopLayers.set(loop.id, layer);
        this.loopContainer.addChild(layer.container);
      }
    }
  }

  update(deltaSeconds: number, bursts: BurstEvent[]): void {
    if (!this.state) {
      return;
    }

    for (const burst of bursts) {
      this.burstPool.trigger(burst);
    }

    this.updateSmoothedFX(deltaSeconds);
    this.syncTearFilter.update(deltaSeconds, this.smoothedFX.syncTear, Math.min(1, this.smoothedFX.noise + this.smoothedFX.chaos * 0.35));
    this.pixelateFilter.setAmount(this.smoothedFX.pixelate);
    this.drawBackground();

    for (const layer of this.loopLayers.values()) {
      layer.update(deltaSeconds, this.smoothedFX);
    }

    this.burstPool.update(deltaSeconds, this.smoothedFX);
    this.drawNoise();
  }

  private updateSmoothedFX(deltaSeconds: number): void {
    if (!this.state) return;

    for (const config of FX_CONTROLS) {
      const target = this.state.globalFX[config.control];
      const current = this.smoothedFX[config.control];
      const amount = 1 - Math.exp(-config.smoothing * deltaSeconds);
      this.smoothedFX[config.control] = lerp(current, target, amount);
    }
  }

  private drawBackground(): void {
    if (!this.state) return;

    const fx = this.smoothedFX;
    const config = visualConfig.background;
    const force = Math.min(1, fx.intensity + fx.bloom * 0.35 + fx.chaos * 0.18);
    const color = hslToHex(fx.hue + 0.64, 0.48 + fx.contrast * 0.18, responseRange(config.brightness, force, 0.06, 0.18));
    const gridAlpha = responseRange(config.gridAlpha, force, 0.035, 0.22) + fx.fade * 0.06 + fx.contrast * 0.04;

    this.background.clear();
    this.background.beginFill(0x050607, 1);
    this.background.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.background.endFill();
    this.background.beginFill(color, responseRange(config.washAlpha, Math.min(1, fx.fade + fx.feedback * 0.4), 0.1, 0.46));
    this.background.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.background.endFill();

    this.background.lineStyle(1, hslToHex(fx.hue, 0.42, 0.44), gridAlpha);
    const gridStep = responseRange(config.gridStep, 1 - fx.density, 42, 120);
    for (let x = 0; x <= INTERNAL_WIDTH; x += gridStep) {
      this.background.moveTo(x, 0);
      this.background.lineTo(x, INTERNAL_HEIGHT);
    }
    for (let y = 0; y <= INTERNAL_HEIGHT; y += gridStep) {
      this.background.moveTo(0, y);
      this.background.lineTo(INTERNAL_WIDTH, y);
    }
  }

  private drawNoise(): void {
    const fx = this.smoothedFX;
    this.noiseLayer.clear();

    const amount = Math.min(1, fx.noise + fx.chaos * 0.25);
    if (amount <= 0.01) return;

    const count = Math.round(20 + amount * responseRange(visualConfig.background.gridStep, fx.density, 90, 260));
    const alpha = 0.03 + amount * 0.16 + fx.contrast * 0.04;
    const size = 1 + Math.round(fx.pixelate * 5);

    this.noiseLayer.beginFill(0xffffff, alpha);
    for (let i = 0; i < count; i += 1) {
      const seed = Math.sin((performance.now() * 0.006 + i * 91.17) * (1 + fx.speed * 0.2));
      const x = ((seed * 43758.5453) % 1 + 1) % 1 * INTERNAL_WIDTH;
      const y = ((Math.sin(seed * 17.23 + i) * 24634.6345) % 1 + 1) % 1 * INTERNAL_HEIGHT;
      this.noiseLayer.drawRect(x, y, size, size);
    }
    this.noiseLayer.endFill();
  }
}
