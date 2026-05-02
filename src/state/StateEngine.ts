import { BURST_NAMES, LOOP_NAMES, MAX_ACTIVE_LOOPS } from "../constants";
import type { InputEvent } from "../input/types";
import { clamp01 } from "../utils/math";
import { getImageSequenceSlotForLoop } from "../visuals/imageSequenceManifest";
import { createDefaultGlobalFX, normalizeFXControl } from "./fxConfig";
import type { BurstEvent, InstrumentState, LoopState, ScreensaverNodeState, ScreensaverNodeType, StateListener } from "./types";

const DEFAULT_STATE: InstrumentState = {
  activeLoops: [],
  burstQueue: [],
  activeScreensaverNodes: [],
  globalFX: createDefaultGlobalFX()
};

const SCREENSAVER_NODE_TYPES: ScreensaverNodeType[] = ["bouncing-shape", "starfield", "bouncing-shape", "starfield"];
const MAX_ACTIVE_SCREENSAVER_NODES = 4;

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

    if (event.type === "global-fx") {
      this.state.globalFX[event.control] = normalizeFXControl(event.control, event.value);
      changed = true;
    }

    if (event.type === "kill-loops") {
      this.state.activeLoops = [];
      this.state.burstQueue = [];
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
    this.activateScreensaverNode(burst);
  }

  private activateScreensaverNode(burst: BurstEvent): void {
    const nodeType = SCREENSAVER_NODE_TYPES[burst.id % SCREENSAVER_NODE_TYPES.length];
    const node: ScreensaverNodeState = {
      id: burst.id,
      type: nodeType,
      label: `${nodeType} ${burst.id + 1}`,
      triggeredAt: burst.createdAt,
      velocity: burst.velocity,
      x: burst.x,
      y: burst.y,
      seed: burst.id * 97.13 + burst.createdAt * 0.001
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
    activeScreensaverNodes: state.activeScreensaverNodes.map((node) => ({ ...node })),
    globalFX: { ...state.globalFX }
  };
}
