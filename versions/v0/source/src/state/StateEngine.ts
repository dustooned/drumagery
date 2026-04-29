import { BURST_NAMES, LOOP_NAMES, MAX_ACTIVE_LOOPS } from "../constants";
import type { InputEvent } from "../input/types";
import { clamp01 } from "../utils/math";
import type { BurstEvent, InstrumentState, LoopState, StateListener } from "./types";

const DEFAULT_STATE: InstrumentState = {
  activeLoops: [],
  burstQueue: [],
  globalFX: {
    hue: 0.5,
    speed: 1,
    distortion: 0,
    intensity: 0.65
  }
};

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
      this.state.globalFX[event.control] = normalizeFXValue(event.control, event.value);
      changed = true;
    }

    if (event.type === "reset") {
      this.state = cloneState(DEFAULT_STATE);
      changed = true;
    }

    if (changed || event.type === "midi-debug" || event.type === "midi-status") {
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

    const nextLoop: LoopState = {
      id: loopId,
      name: LOOP_NAMES[loopId] ?? `Loop ${loopId + 1}`,
      startedAt: performance.now()
    };

    if (this.state.activeLoops.length >= MAX_ACTIVE_LOOPS) {
      this.state.activeLoops.shift();
    }

    this.state.activeLoops.push(nextLoop);
  }

  private queueBurst(event: Extract<InputEvent, { type: "burst" }>): void {
    this.state.burstQueue.push({
      id: event.burstId,
      name: BURST_NAMES[event.burstId] ?? `Burst ${event.burstId + 1}`,
      createdAt: performance.now(),
      velocity: clamp01(event.velocity),
      x: clamp01(event.x),
      y: clamp01(event.y)
    });
  }

  private notify(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

function normalizeFXValue(control: keyof InstrumentState["globalFX"], value: number): number {
  if (control === "speed") {
    return Math.min(2, Math.max(0.2, value));
  }

  return clamp01(value);
}

function cloneState(state: InstrumentState): InstrumentState {
  return {
    activeLoops: state.activeLoops.map((loop) => ({ ...loop })),
    burstQueue: state.burstQueue.map((burst) => ({ ...burst })),
    globalFX: { ...state.globalFX }
  };
}
