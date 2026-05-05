import { Container, Graphics, Rectangle } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import { createDefaultGlobalFX, FX_CONTROLS } from "../state/fxConfig";
import type { BurstEvent, GlobalFXState, InstrumentState } from "../state/types";
import { hslToHex, lerp } from "../utils/math";
import { BurstPool } from "./BurstPool";
import { ChromaSplitFilter } from "./ChromaSplitFilter";
import { HardSyncBandsFilter } from "./HardSyncBandsFilter";
import { ImageSequenceLoopLayer } from "./ImageSequenceLoopLayer";
import { getImageSequenceSlotForLoop } from "./imageSequenceManifest";
import { LoopLayer } from "./LoopLayer";
import { PhosphorTrailLayer } from "./PhosphorTrailLayer";
import { PixelateFilter } from "./PixelateFilter";
import { ScreensaverNodeLayer } from "./ScreensaverNodeLayer";
import { SyncTearFilter } from "./SyncTearFilter";
import { VerticalRollFilter } from "./VerticalRollFilter";
import { responseRange, visualConfig } from "./visualConfig";

export class VisualEngine {
  private readonly background = new Graphics();
  private readonly noiseLayer = new Graphics();
  private readonly loopContainer = new Container();
  private readonly burstPool = new BurstPool();
  private readonly phosphorTrailLayer = new PhosphorTrailLayer();
  private readonly screensaverNodeLayer = new ScreensaverNodeLayer();
  private readonly syncTearFilter = new SyncTearFilter();
  private readonly verticalRollFilter = new VerticalRollFilter();
  private readonly hardSyncBandsFilter = new HardSyncBandsFilter();
  private readonly chromaSplitFilter = new ChromaSplitFilter();
  private readonly pixelateFilter = new PixelateFilter();
  private readonly loopLayers = new Map<number, LoopLayer | ImageSequenceLoopLayer>();
  private state: InstrumentState | null = null;
  private readonly smoothedFX: GlobalFXState = createDefaultGlobalFX();

  constructor(private readonly stage: Container) {
    this.stage.filters = [
      this.syncTearFilter,
      this.verticalRollFilter,
      this.hardSyncBandsFilter,
      this.chromaSplitFilter,
      this.pixelateFilter
    ];
    this.stage.filterArea = new Rectangle(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.stage.addChild(this.background);
    this.stage.addChild(this.phosphorTrailLayer.container);
    this.stage.addChild(this.screensaverNodeLayer.container);
    this.stage.addChild(this.loopContainer);
    this.stage.addChild(this.burstPool.container);
    this.stage.addChild(this.noiseLayer);
  }

  setPresentationSize(width: number, height: number): void {
    this.stage.filterArea = new Rectangle(0, 0, Math.max(1, width), Math.max(1, height));
  }

  syncState(state: InstrumentState): void {
    this.state = state;
    this.screensaverNodeLayer.syncNodes(state.activeScreensaverNodes);
    this.burstPool.syncHeldBursts(state.activeBurstHolds);
    const activeIds = new Set(state.activeLoops.map((loop) => loop.id));

    for (const [loopId, layer] of this.loopLayers) {
      if (!activeIds.has(loopId)) {
        this.loopContainer.removeChild(layer.container);
        this.loopLayers.delete(loopId);
      }
    }

    for (const loop of state.activeLoops) {
      if (!this.loopLayers.has(loop.id)) {
        const imageSequenceSlot = getImageSequenceSlotForLoop(loop.id);
        const layer = imageSequenceSlot ? new ImageSequenceLoopLayer(loop, imageSequenceSlot) : new LoopLayer(loop);
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
      this.phosphorTrailLayer.captureBurst(burst, this.smoothedFX);
      this.burstPool.trigger(burst);
    }

    this.updateSmoothedFX(deltaSeconds);
    this.syncTearFilter.update(deltaSeconds, this.smoothedFX.syncTear, Math.min(3, this.smoothedFX.noise + this.smoothedFX.chaos * 0.35));
    this.verticalRollFilter.update(deltaSeconds, this.smoothedFX.verticalRoll, this.smoothedFX.syncTear + this.smoothedFX.chaos * 0.35);
    this.hardSyncBandsFilter.update(deltaSeconds, this.smoothedFX.syncBands, this.smoothedFX.chaos + this.smoothedFX.syncTear * 0.25);
    this.chromaSplitFilter.update(deltaSeconds, this.smoothedFX.chromaShift, this.smoothedFX.chaos + this.smoothedFX.noise * 0.25);
    this.pixelateFilter.setAmount(this.smoothedFX.pixelate);
    this.drawBackground();
    this.phosphorTrailLayer.update(deltaSeconds, this.smoothedFX, this.state.activeLoops);
    this.screensaverNodeLayer.update(deltaSeconds, this.smoothedFX);

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
    const overdrive = getOverdrive(fx);
    const force = Math.min(1, fx.intensity + fx.bloom * 0.35 + fx.chaos * 0.18);
    const color = hslToHex(fx.hue + 0.64 + overdrive * 0.025, 0.48 + fx.contrast * 0.18, responseRange(config.brightness, force, 0.06, 0.18 + overdrive * 0.08));
    const gridAlpha = responseRange(config.gridAlpha, force, 0.035, 0.22) + fx.fade * 0.06 + fx.contrast * 0.04 + overdrive * 0.08;

    this.background.clear();
    this.background.beginFill(0x050607, 1);
    this.background.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.background.endFill();
    this.background.beginFill(color, responseRange(config.washAlpha, Math.min(1, fx.fade + fx.feedback * 0.4), 0.1, 0.46 + overdrive * 0.16));
    this.background.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.background.endFill();

    this.background.lineStyle(1 + overdrive * 1.4, hslToHex(fx.hue, 0.42 + overdrive * 0.1, 0.44 + overdrive * 0.1), gridAlpha);
    const densityDrive = Math.min(1, fx.density / 3 + overdrive * 0.35);
    const gridStep = responseRange(config.gridStep, 1 - densityDrive, 24, 120);
    for (let x = 0; x <= INTERNAL_WIDTH; x += gridStep) {
      this.background.moveTo(x, 0);
      this.background.lineTo(x, INTERNAL_HEIGHT);
    }
    for (let y = 0; y <= INTERNAL_HEIGHT; y += gridStep) {
      this.background.moveTo(0, y);
      this.background.lineTo(INTERNAL_WIDTH, y);
    }

    if (overdrive > 0.01) {
      this.background.lineStyle(1, 0xffffff, 0.035 + overdrive * 0.09);
      const scanStep = Math.max(4, 12 - overdrive * 5);
      for (let y = 0; y <= INTERNAL_HEIGHT; y += scanStep) {
        const wobble = Math.sin(y * 0.02 + performance.now() * 0.003) * overdrive * 12;
        this.background.moveTo(wobble, y);
        this.background.lineTo(INTERNAL_WIDTH + wobble, y);
      }
    }
  }

  private drawNoise(): void {
    const fx = this.smoothedFX;
    this.noiseLayer.clear();

    const overdrive = getOverdrive(fx);
    const amount = Math.min(3, fx.noise + fx.chaos * 0.25 + overdrive * 0.8);
    if (amount <= 0.01) return;

    const count = Math.round(20 + amount * responseRange(visualConfig.background.gridStep, Math.min(1, fx.density / 3), 90, 360));
    const alpha = 0.03 + amount * 0.11 + fx.contrast * 0.04 + overdrive * 0.08;
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

function getOverdrive(fx: GlobalFXState): number {
  return Math.min(
    1,
    Math.max(
      0,
      fx.intensity - 1,
      fx.bloom - 1,
      fx.distortion - 1,
      fx.chromaShift - 1,
      fx.verticalRoll - 1,
      fx.phosphorTrail - 1,
      fx.syncBands - 1,
      fx.feedback - 1,
      fx.noise - 1,
      fx.density - 1,
      fx.contrast - 1,
      fx.chaos - 1,
      fx.pixelate - 1,
      fx.burstPower - 1
    ) / 2
  );
}
