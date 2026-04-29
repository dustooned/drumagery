import { Container, Graphics } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import type { BurstEvent, InstrumentState } from "../state/types";
import { hslToHex } from "../utils/math";
import { BurstPool } from "./BurstPool";
import { LoopLayer } from "./LoopLayer";

export class VisualEngine {
  private readonly background = new Graphics();
  private readonly loopContainer = new Container();
  private readonly burstPool = new BurstPool();
  private readonly loopLayers = new Map<number, LoopLayer>();
  private state: InstrumentState | null = null;

  constructor(private readonly stage: Container) {
    this.stage.addChild(this.background);
    this.stage.addChild(this.loopContainer);
    this.stage.addChild(this.burstPool.container);
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

    this.drawBackground();

    for (const layer of this.loopLayers.values()) {
      layer.update(deltaSeconds, this.state.globalFX);
    }

    this.burstPool.update(deltaSeconds, this.state.globalFX);
  }

  private drawBackground(): void {
    if (!this.state) return;

    const fx = this.state.globalFX;
    const color = hslToHex(fx.hue + 0.64, 0.48, 0.09 + fx.intensity * 0.05);

    this.background.clear();
    this.background.beginFill(0x050607, 1);
    this.background.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.background.endFill();
    this.background.beginFill(color, 0.32);
    this.background.drawRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.background.endFill();

    this.background.lineStyle(1, hslToHex(fx.hue, 0.42, 0.44), 0.13 + fx.intensity * 0.1);
    for (let x = 0; x <= INTERNAL_WIDTH; x += 80) {
      this.background.moveTo(x, 0);
      this.background.lineTo(x, INTERNAL_HEIGHT);
    }
    for (let y = 0; y <= INTERNAL_HEIGHT; y += 80) {
      this.background.moveTo(0, y);
      this.background.lineTo(INTERNAL_WIDTH, y);
    }
  }
}
