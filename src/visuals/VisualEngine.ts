import { Container, Graphics, Rectangle } from "pixi.js";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "../constants";
import { createDefaultGlobalFX, FX_CONTROLS, normalizeFXControl } from "../state/fxConfig";
import type { BurstEvent, BurstHoldState, GlobalFXControl, GlobalFXState, InstrumentState } from "../state/types";
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

    const targetFX = this.state.reactiveModeEnabled
      ? composeBurstHoldFX(this.state.globalFX, this.state.activeBurstHolds)
      : this.state.globalFX;
    for (const config of FX_CONTROLS) {
      const target = targetFX[config.control];
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

type BurstHoldFxProfile = {
  tvAxis: AxisEffector[];
  supportAxis: AxisEffector[];
  crossAxis: AxisEffector[];
};

type AxisEffector = {
  control: GlobalFXControl;
  low: number;
  high: number;
  base: number;
  pressure: number;
  movement: number;
  drift: number;
};

const BURST_HOLD_FX_PROFILES: BurstHoldFxProfile[] = [
  {
    tvAxis: [
      { control: "bloom", low: 0.18, high: 0.42, base: 0.08, pressure: 0.2, movement: 0.16, drift: 0.1 },
      { control: "contrast", low: 0.1, high: 0.32, base: 0.04, pressure: 0.12, movement: 0.08, drift: 0.08 },
      { control: "syncBands", low: 0.02, high: 0.12, base: 0.01, pressure: 0.04, movement: 0.1, drift: 0.06 }
    ],
    supportAxis: [
      { control: "hue", low: 0.03, high: 0.22, base: 0.02, pressure: 0.04, movement: 0.12, drift: 0.12 },
      { control: "density", low: 0.06, high: 0.18, base: 0.01, pressure: 0.04, movement: 0.12, drift: 0.06 },
      { control: "phosphorTrail", low: 0.18, high: 0.06, base: 0.02, pressure: 0.06, movement: 0.08, drift: 0.12 }
    ],
    crossAxis: [
      { control: "feedback", low: 0.04, high: 0.12, base: 0.01, pressure: 0.04, movement: 0.08, drift: 0.08 }
    ]
  },
  {
    tvAxis: [
      { control: "chromaShift", low: 0.12, high: 0.48, base: 0.08, pressure: 0.22, movement: 0.22, drift: 0.16 },
      { control: "syncBands", low: 0.28, high: 0.1, base: 0.04, pressure: 0.08, movement: 0.2, drift: 0.22 },
      { control: "noise", low: 0.04, high: 0.22, base: 0.02, pressure: 0.14, movement: 0.2, drift: 0.14 },
      { control: "syncTear", low: 0.02, high: 0.18, base: 0.01, pressure: 0.08, movement: 0.18, drift: 0.1 }
    ],
    supportAxis: [
      { control: "bloom", low: 0.3, high: 0.1, base: 0.03, pressure: 0.14, movement: 0.08, drift: 0.12 },
      { control: "contrast", low: 0.08, high: 0.38, base: 0.04, pressure: 0.18, movement: 0.08, drift: 0.08 },
      { control: "feedback", low: 0.12, high: 0.22, base: 0.02, pressure: 0.08, movement: 0.12, drift: 0.14 },
      { control: "density", low: 0.04, high: 0.22, base: 0.01, pressure: 0.06, movement: 0.18, drift: 0.08 }
    ],
    crossAxis: [
      { control: "phosphorTrail", low: 0.12, high: 0.18, base: 0.02, pressure: 0.08, movement: 0.08, drift: 0.16 }
    ]
  },
  {
    tvAxis: [
      { control: "noise", low: 0.16, high: 0.48, base: 0.06, pressure: 0.24, movement: 0.18, drift: 0.22 },
      { control: "syncTear", low: 0.24, high: 0.08, base: 0.02, pressure: 0.12, movement: 0.22, drift: 0.14 },
      { control: "syncBands", low: 0.03, high: 0.18, base: 0.01, pressure: 0.06, movement: 0.16, drift: 0.12 }
    ],
    supportAxis: [
      { control: "bloom", low: 0.34, high: 0.08, base: 0.04, pressure: 0.18, movement: 0.08, drift: 0.14 },
      { control: "pixelate", low: 0.04, high: 0.3, base: 0.02, pressure: 0.1, movement: 0.1, drift: 0.08 },
      { control: "feedback", low: 0.24, high: 0.16, base: 0.02, pressure: 0.08, movement: 0.14, drift: 0.18 },
      { control: "hue", low: 0.1, high: 0.02, base: 0.01, pressure: 0.04, movement: 0.14, drift: 0.12 }
    ],
    crossAxis: [
      { control: "chromaShift", low: 0.04, high: 0.18, base: 0.02, pressure: 0.1, movement: 0.08, drift: 0.12 }
    ]
  },
  {
    tvAxis: [
      { control: "chromaShift", low: 0.24, high: 0.56, base: 0.08, pressure: 0.2, movement: 0.3, drift: 0.18 },
      { control: "syncTear", low: 0.08, high: 0.42, base: 0.04, pressure: 0.12, movement: 0.28, drift: 0.14 },
      { control: "syncBands", low: 0.1, high: 0.34, base: 0.04, pressure: 0.08, movement: 0.26, drift: 0.18 },
      { control: "noise", low: 0.06, high: 0.24, base: 0.02, pressure: 0.12, movement: 0.24, drift: 0.14 },
      { control: "density", low: 0.06, high: 0.18, base: 0.01, pressure: 0.04, movement: 0.12, drift: 0.08 }
    ],
    supportAxis: [
      { control: "distortion", low: 0.12, high: 0.36, base: 0.04, pressure: 0.18, movement: 0.22, drift: 0.12 },
      { control: "pixelate", low: 0.04, high: 0.2, base: 0.01, pressure: 0.06, movement: 0.12, drift: 0.06 },
      { control: "density", low: 0.2, high: 0.08, base: 0.02, pressure: 0.04, movement: 0.18, drift: 0.08 },
      { control: "feedback", low: 0.08, high: 0.2, base: 0.02, pressure: 0.08, movement: 0.12, drift: 0.1 }
    ],
    crossAxis: [
      { control: "chromaShift", low: 0.08, high: 0.28, base: 0.02, pressure: 0.12, movement: 0.18, drift: 0.12 },
      { control: "syncTear", low: 0.04, high: 0.22, base: 0.01, pressure: 0.08, movement: 0.18, drift: 0.1 }
    ]
  }
];
const BURST_HOLD_FX_STRENGTH = 0.34;
const BURST_HOLD_GROWTH_RATE = 0.9;
const BURST_HOLD_DRIFT_RATE = 0.82;
const MOVEMENT_IMPULSE_DECAY_MS = 520;
const MULTI_TOUCH_BLEND_STRENGTH = 0.44;
const IMPACT_CUE_MS = 360;

function composeBurstHoldFX(baseFX: GlobalFXState, holds: BurstHoldState[]): GlobalFXState {
  const fx = { ...baseFX };
  const now = performance.now();

  for (const hold of holds) {
    const profile = BURST_HOLD_FX_PROFILES[hold.id % BURST_HOLD_FX_PROFILES.length];
    if (!profile) continue;

    const ageSeconds = Math.max(0, (now - hold.startedAt) / 1000);
    const grow = 1 - Math.exp(-ageSeconds * BURST_HOLD_GROWTH_RATE);
    const releaseFade = getBurstHoldReleaseFade(hold, now);
    if (releaseFade <= 0) continue;

    const pressure = Math.max(hold.pressure, hold.velocity * 0.72);
    const amount = grow * releaseFade;
    const positionMovementDrive = Math.min(1, Math.hypot(hold.x - 0.5, hold.y - 0.5) * 1.55);
    const movementImpulse = getMovementImpulse(hold, now);
    const movementDrive = Math.min(1, positionMovementDrive * 0.45 + movementImpulse);
    const diagonalDrive = 1 - Math.min(1, Math.abs(hold.x - hold.y) * 2.2);
    const driftDrive = 0.5 + Math.sin(ageSeconds * BURST_HOLD_DRIFT_RATE + hold.id * 1.73) * 0.5;

    applyAxisEffectors(fx, baseFX, profile.tvAxis, 1 - hold.y, amount, pressure, movementDrive, driftDrive);
    applyAxisEffectors(fx, baseFX, profile.supportAxis, hold.x, amount, pressure, movementDrive, driftDrive);
    applyAxisEffectors(fx, baseFX, profile.crossAxis, diagonalDrive, amount * 0.75, pressure, movementDrive, driftDrive);
    applyImpactCueFX(fx, baseFX, hold, now, releaseFade);
  }

  applyMultiTouchBlendFX(fx, baseFX, holds, now);

  return fx;
}

function applyImpactCueFX(fx: GlobalFXState, baseFX: GlobalFXState, hold: BurstHoldState, now: number, releaseFade: number): void {
  const impactAge = now - hold.startedAt;
  if (impactAge > IMPACT_CUE_MS) return;

  const impact = 1 - Math.pow(Math.min(1, Math.max(0, impactAge / IMPACT_CUE_MS)), 3);
  const force = impact * releaseFade * (0.72 + hold.velocity * 0.34 + hold.pressure * 0.18) * BURST_HOLD_FX_STRENGTH;

  addOverlayFX(fx, baseFX, "syncTear", force * 0.2);
  addOverlayFX(fx, baseFX, "chromaShift", force * 0.16);
  addOverlayFX(fx, baseFX, "syncBands", force * 0.14);
  addOverlayFX(fx, baseFX, "bloom", force * 0.12);
}

function applyAxisEffectors(
  fx: GlobalFXState,
  baseFX: GlobalFXState,
  effectors: AxisEffector[],
  axisValue: number,
  amount: number,
  pressure: number,
  movementDrive: number,
  driftDrive: number
): void {
  const axis = Math.min(1, Math.max(0, axisValue));

  for (const item of effectors) {
    const axisMix = item.low * (1 - axis) + item.high * axis;
    const overlay =
      (item.base + axisMix + item.pressure * pressure + item.movement * movementDrive + item.drift * driftDrive) *
      amount *
      BURST_HOLD_FX_STRENGTH;
    addOverlayFX(fx, baseFX, item.control, overlay);
  }
}

function applyMultiTouchBlendFX(fx: GlobalFXState, baseFX: GlobalFXState, holds: BurstHoldState[], now: number): void {
  const activeHolds = holds.filter((hold) => hold.releasedAt === null);
  if (activeHolds.length < 2) return;

  for (let index = 0; index < activeHolds.length - 1; index += 1) {
    const first = activeHolds[index];
    const second = activeHolds[index + 1];
    const centerX = (first.x + second.x) * 0.5;
    const centerY = (first.y + second.y) * 0.5;
    const separation = Math.min(1, Math.hypot(first.x - second.x, first.y - second.y));
    const pressure = Math.min(1, (first.pressure + second.pressure + first.velocity + second.velocity) * 0.25);
    const movementImpulse = Math.max(getMovementImpulse(first, now), getMovementImpulse(second, now));
    const ageSeconds = Math.max(0, (now - Math.max(first.startedAt, second.startedAt)) / 1000);
    const grow = 1 - Math.exp(-ageSeconds * 1.15);
    const centerDrive = 1 - Math.min(1, Math.max(Math.abs(centerX - 0.5), Math.abs(centerY - 0.5)) * 2);
    const crossingDrive = 1 - Math.min(1, Math.abs(centerX - centerY) * 2);
    const driftDrive = 0.5 + Math.sin(ageSeconds * 1.05 + (first.id + second.id) * 0.91) * 0.5;
    const pairDrive = grow * (0.72 + pressure * 0.42 + movementImpulse * 0.35 + (1 - separation) * 0.22) * MULTI_TOUCH_BLEND_STRENGTH;
    const pairHue = ((first.id + second.id) % 4) / 4;

    addOverlayFX(fx, baseFX, "feedback", pairDrive * (0.1 + centerDrive * 0.28 + driftDrive * 0.1));
    addOverlayFX(fx, baseFX, "phosphorTrail", pairDrive * (0.08 + centerDrive * 0.3 + pressure * 0.12));
    addOverlayFX(fx, baseFX, "chromaShift", pairDrive * (0.1 + crossingDrive * 0.26 + pairHue * 0.08 + movementImpulse * 0.18));
    addOverlayFX(fx, baseFX, "syncBands", pairDrive * (0.06 + separation * 0.2 + driftDrive * 0.08 + movementImpulse * 0.2));
    addOverlayFX(fx, baseFX, "syncTear", pairDrive * (0.04 + movementImpulse * 0.24 + separation * 0.08));
    addOverlayFX(fx, baseFX, "hue", pairDrive * (0.03 + crossingDrive * 0.08 + movementImpulse * 0.08));
    addOverlayFX(fx, baseFX, "density", pairDrive * (0.03 + movementImpulse * 0.16 + (1 - centerDrive) * 0.08));
    addOverlayFX(fx, baseFX, "bloom", pairDrive * (0.05 + pressure * 0.22 + centerDrive * 0.12));
    addOverlayFX(fx, baseFX, "noise", pairDrive * (0.04 + separation * 0.12 + (1 - centerDrive) * 0.12));
  }
}

function addOverlayFX(fx: GlobalFXState, baseFX: GlobalFXState, control: GlobalFXControl, amount: number): void {
  fx[control] = normalizeFXControl(control, Math.max(fx[control], baseFX[control] + amount));
}

function getMovementImpulse(hold: BurstHoldState, now: number): number {
  const age = Math.max(0, now - hold.movementAt);
  if (age >= MOVEMENT_IMPULSE_DECAY_MS) return 0;

  const ease = 1 - Math.pow(age / MOVEMENT_IMPULSE_DECAY_MS, 3);
  return Math.min(1, hold.movementEnergy * ease);
}

function getBurstHoldReleaseFade(hold: BurstHoldState, now: number): number {
  if (hold.releasedAt === null) return 1;

  const releaseAge = now - hold.releasedAt;
  if (releaseAge >= 420) return 0;

  return 1 - Math.pow(Math.min(1, Math.max(0, releaseAge / 420)), 3);
}
