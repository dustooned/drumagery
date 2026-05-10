import { BURST_NAMES, LOOP_NAMES, MAX_ACTIVE_LOOPS } from "../constants";
import type { InputEvent } from "../input/types";
import { clamp01 } from "../utils/math";
import { getImageSequenceSlotForLoop } from "../visuals/imageSequenceManifest";
import { createDefaultGlobalFX, normalizeFXControl } from "./fxConfig";
import type { BurstEvent, BurstHoldState, InstrumentState, LoopState, ScreensaverNodeState, ScreensaverNodeType, StateListener } from "./types";

const DEFAULT_STATE: InstrumentState = {
  activeLoops: [],
  burstQueue: [],
  activeBurstHolds: [],
  activeScreensaverNodes: [],
  globalFX: createDefaultGlobalFX(),
  reactiveModeEnabled: false
};

const SCREENSAVER_NODE_TYPES: ScreensaverNodeType[] = [
  "grid-ocean",
  "clouds",
  "sandstorm",
  "rain",
  "wind",
  "starfield",
  "mystify",
  "static",
  "pulse"
];
const MAX_ACTIVE_SCREENSAVER_NODES = 6;

export class StateEngine {
  private state: InstrumentState = cloneState(DEFAULT_STATE);
  private listeners = new Set<StateListener>();

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): InstrumentState {
    return cloneState(this.state);
  }

  handleInput(event: InputEvent): void {
    let changed = false;

    if (event.type === "loop-toggle") {
      this.toggleLoop(event.loopId);
      changed = true;
    }

    if (event.type === "burst") {
      this.queueBurst(event);
      changed = true;
    }

    if (event.type === "burst-hold-start") {
      this.startBurstHold(event);
      changed = true;
    }

    if (event.type === "burst-hold-move") {
      this.moveBurstHold(event);
      changed = true;
    }

    if (event.type === "burst-hold-release") {
      this.releaseBurstHold(event.burstId);
      changed = true;
    }

    if (event.type === "screensaver-start") {
      this.startScreensaverNode(event);
      changed = true;
    }

    if (event.type === "screensaver-release") {
      this.releaseScreensaverNode(event.nodeId);
      changed = true;
    }

    if (event.type === "global-fx") {
      this.state.globalFX[event.control] = normalizeFXControl(event.control, event.value);
      changed = true;
    }

    if (event.type === "reactive-mode") {
      this.state.reactiveModeEnabled = event.enabled;
      changed = true;
    }

    if (event.type === "kill-loops") {
      this.state.activeLoops = [];
      this.state.burstQueue = [];
      this.state.activeBurstHolds = [];
      this.state.activeScreensaverNodes = [];
      changed = true;
    }

    if (event.type === "reset") {
      this.state = cloneState(DEFAULT_STATE);
      changed = true;
    }

    if (changed || event.type === "midi-debug" || event.type === "midi-status" || event.type === "midi-learn-reset") {
      this.notify();
    }
  }

  drainBurstQueue(): BurstEvent[] {
    const bursts = this.state.burstQueue;
    this.state.burstQueue = [];
    return bursts;
  }

  private toggleLoop(loopId: number): void {
    const activeIndex = this.state.activeLoops.findIndex((loop) => loop.id === loopId);
    if (activeIndex >= 0) {
      this.state.activeLoops.splice(activeIndex, 1);
      return;
    }

    const imageSequenceSlot = getImageSequenceSlotForLoop(loopId);
    const nextLoop: LoopState = {
      id: loopId,
      name: imageSequenceSlot?.name ?? LOOP_NAMES[loopId] ?? `Loop ${loopId + 1}`,
      startedAt: performance.now(),
      imageSequenceSlotId: imageSequenceSlot?.id ?? null
    };

    if (this.state.activeLoops.length >= MAX_ACTIVE_LOOPS) {
      this.state.activeLoops.shift();
    }

    this.state.activeLoops.push(nextLoop);
  }

  private queueBurst(event: Extract<InputEvent, { type: "burst" }>): void {
    const burst: BurstEvent = {
      id: event.burstId,
      name: BURST_NAMES[event.burstId] ?? `Burst ${event.burstId + 1}`,
      createdAt: performance.now(),
      velocity: clamp01(event.velocity),
      x: clamp01(event.x),
      y: clamp01(event.y)
    };

    this.state.burstQueue.push(burst);
  }

  private startBurstHold(event: Extract<InputEvent, { type: "burst-hold-start" }>): void {
    const hold: BurstHoldState = {
      id: event.burstId,
      name: BURST_NAMES[event.burstId] ?? `Burst ${event.burstId + 1}`,
      startedAt: performance.now(),
      releasedAt: null,
      velocity: clamp01(event.velocity),
      pressure: clamp01(event.pressure),
      x: clamp01(event.x),
      y: clamp01(event.y)
    };
    const existingIndex = this.state.activeBurstHolds.findIndex((item) => item.id === hold.id);

    if (existingIndex >= 0) {
      this.state.activeBurstHolds[existingIndex] = hold;
      return;
    }

    this.state.activeBurstHolds.push(hold);
  }

  private moveBurstHold(event: Extract<InputEvent, { type: "burst-hold-move" }>): void {
    const hold = this.state.activeBurstHolds.find((item) => item.id === event.burstId && item.releasedAt === null);
    if (!hold) return;

    hold.pressure = clamp01(event.pressure);
    hold.x = clamp01(event.x);
    hold.y = clamp01(event.y);
  }

  private releaseBurstHold(burstId: number): void {
    const hold = this.state.activeBurstHolds.find((item) => item.id === burstId);
    if (!hold || hold.releasedAt !== null) return;

    hold.releasedAt = performance.now();
  }

  private startScreensaverNode(event: Extract<InputEvent, { type: "screensaver-start" }>): void {
    const nodeType = SCREENSAVER_NODE_TYPES[event.nodeId % SCREENSAVER_NODE_TYPES.length];
    const triggeredAt = performance.now();
    const node: ScreensaverNodeState = {
      id: event.nodeId,
      type: nodeType,
      label: `${nodeType} ${event.nodeId + 1}`,
      triggeredAt,
      releasedAt: null,
      velocity: clamp01(event.velocity),
      x: clamp01(event.x),
      y: clamp01(event.y),
      seed: event.nodeId * 97.13 + triggeredAt * 0.001
    };
    const existingIndex = this.state.activeScreensaverNodes.findIndex((item) => item.id === node.id);

    if (existingIndex >= 0) {
      this.state.activeScreensaverNodes[existingIndex] = node;
      return;
    }

    if (this.state.activeScreensaverNodes.length >= MAX_ACTIVE_SCREENSAVER_NODES) {
      this.state.activeScreensaverNodes.shift();
    }

    this.state.activeScreensaverNodes.push(node);
  }

  private releaseScreensaverNode(nodeId: number): void {
    const node = this.state.activeScreensaverNodes.find((item) => item.id === nodeId);
    if (!node || node.releasedAt !== null) return;

    node.releasedAt = performance.now();
  }

  private notify(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

function cloneState(state: InstrumentState): InstrumentState {
  return {
    activeLoops: state.activeLoops.map((loop) => ({ ...loop })),
    burstQueue: state.burstQueue.map((burst) => ({ ...burst })),
    activeBurstHolds: state.activeBurstHolds.map((hold) => ({ ...hold })),
    activeScreensaverNodes: state.activeScreensaverNodes.map((node) => ({ ...node })),
    globalFX: { ...state.globalFX },
    reactiveModeEnabled: state.reactiveModeEnabled
  };
}
