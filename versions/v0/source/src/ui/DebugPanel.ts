import { BURST_NAMES, LOOP_NAMES } from "../constants";
import { InputRouter } from "../input/InputRouter";
import type { InputEvent } from "../input/types";
import type { InstrumentState } from "../state/types";

export class DebugPanel {
  private lastInput = "none";
  private midiStatus = "MIDI: click Connect MIDI";
  private midiRaw = "no MIDI messages yet";
  private currentState: InstrumentState | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly router: InputRouter,
    private readonly onMidiConnect: () => void | Promise<void>
  ) {
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("input", this.handleInput);
  }

  recordInput(event: InputEvent): void {
    if (event.type === "global-fx") {
      this.lastInput = `${event.source}: ${event.control} ${event.value.toFixed(2)}`;
      return;
    }

    if (event.type === "loop-toggle") {
      this.lastInput = `${event.source}: loop ${event.loopId + 1}`;
      return;
    }

    if (event.type === "burst") {
      this.lastInput = `${event.source}: burst ${event.burstId + 1}`;
      return;
    }

    if (event.type === "midi-status") {
      this.midiStatus = `MIDI: ${event.message}`;
      this.lastInput = `midi: ${event.status}`;
      return;
    }

    if (event.type === "midi-debug") {
      this.midiRaw = `${event.inputName} ch${event.channel}: ${event.label}`;
      this.lastInput = `midi: ${event.label}`;
      return;
    }

    this.lastInput = `${event.source}: reset`;
  }

  render(state: InstrumentState): void {
    this.currentState = state;
    const fx = state.globalFX;
    this.root.innerHTML = `
      <h1 class="debug-title">Visual Instrument V0</h1>
      <div class="debug-readout">
        <span>loops: ${state.activeLoops.map((loop) => loop.name).join(", ") || "none"}</span>
        <span>queued bursts: ${state.burstQueue.length}</span>
        <span>last input: ${this.lastInput}</span>
        <span>${this.midiStatus}</span>
        <span>raw: ${this.midiRaw}</span>
      </div>
      <div class="debug-grid">
        ${LOOP_NAMES.map(
          (name, index) => `<button type="button" data-loop="${index}">${index + 1} ${name}</button>`
        ).join("")}
      </div>
      <div class="debug-grid">
        ${BURST_NAMES.map(
          (name, index) => `<button type="button" data-burst="${index}">Q${index + 1} ${name}</button>`
        ).join("")}
      </div>
      ${this.renderSlider("hue", "Hue", fx.hue, 0, 1, 0.01)}
      ${this.renderSlider("speed", "Speed", fx.speed, 0.2, 2, 0.01)}
      ${this.renderSlider("distortion", "Distort", fx.distortion, 0, 1, 0.01)}
      ${this.renderSlider("intensity", "Intensity", fx.intensity, 0, 1, 0.01)}
      <div class="debug-grid">
        <button type="button" data-midi-connect="true">Connect MIDI</button>
        <button type="button" data-reset="true">Reset</button>
      </div>
    `;
  }

  private renderSlider(
    control: "hue" | "speed" | "distortion" | "intensity",
    label: string,
    value: number,
    min: number,
    max: number,
    step: number
  ): string {
    return `
      <label class="debug-slider">
        <span>${label}</span>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-fx="${control}" />
        <span>${value.toFixed(2)}</span>
      </label>
    `;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const loopId = target.dataset.loop;
    if (loopId !== undefined) {
      this.router.dispatch({ type: "loop-toggle", source: "debug", loopId: Number(loopId), velocity: 1 });
      return;
    }

    const burstId = target.dataset.burst;
    if (burstId !== undefined) {
      this.router.dispatch({
        type: "burst",
        source: "debug",
        burstId: Number(burstId),
        velocity: 0.9,
        x: 0.5,
        y: 0.5
      });
      return;
    }

    if (target.dataset.reset) {
      this.router.dispatch({ type: "reset", source: "debug" });
      return;
    }

    if (target.dataset.midiConnect) {
      void this.onMidiConnect();
    }
  };

  private readonly handleInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const control = target.dataset.fx as "hue" | "speed" | "distortion" | "intensity" | undefined;
    if (!control) return;

    this.router.dispatch({
      type: "global-fx",
      source: "debug",
      control,
      value: Number(target.value)
    });

    if (this.currentState) {
      this.render(this.currentState);
    }
  };
}
