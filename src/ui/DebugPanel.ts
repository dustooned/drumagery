import { BURST_NAMES, LOOP_NAMES } from "../constants";
import { InputRouter } from "../input/InputRouter";
import { midiMap } from "../input/midiMap";
import type { InputEvent } from "../input/types";
import { FX_CONTROLS, getFXControlConfig } from "../state/fxConfig";
import type { GlobalFXControl, InstrumentState } from "../state/types";

export class DebugPanel {
  private lastInput = "none";
  private midiStatus = "MIDI: click Connect MIDI";
  private midiRaw = "no MIDI messages yet";
  private readonly midiMessages: string[] = [];
  private readonly learnedCc = new Map<number, string>();
  private currentState: InstrumentState | null = null;
  private lastBurst = "none";
  private throttleRender = false;
  private queuedRender = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly router: InputRouter,
    private readonly onMidiConnect: () => void | Promise<void>,
    private readonly onMidiLearnReset: () => void
  ) {
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("input", this.handleInput);
  }

  recordInput(event: InputEvent): void {
    if (event.type === "global-fx") {
      this.lastInput = `${event.source}: ${event.control} ${event.value.toFixed(2)}`;
      this.throttleRender = event.source === "midi";
      return;
    }

    if (event.type === "loop-toggle") {
      this.lastInput = `${event.source}: loop ${event.loopId + 1}`;
      this.throttleRender = false;
      return;
    }

    if (event.type === "burst") {
      this.lastInput = `${event.source}: burst ${event.burstId + 1}`;
      this.lastBurst = `${event.source}: burst ${event.burstId + 1} velocity ${event.velocity.toFixed(2)}`;
      this.throttleRender = false;
      return;
    }

    if (event.type === "kill-loops") {
      this.lastInput = `${event.source}: kill loops`;
      this.lastBurst = "none";
      this.throttleRender = false;
      return;
    }

    if (event.type === "midi-status") {
      this.midiStatus = `MIDI: ${event.message}`;
      this.lastInput = `midi: ${event.status}`;
      this.throttleRender = false;
      return;
    }

    if (event.type === "midi-learn-reset") {
      this.learnedCc.clear();
      this.midiMessages.length = 0;
      this.midiRaw = "no MIDI messages yet";
      this.lastInput = "midi: learned CC reset";
      this.throttleRender = false;
      return;
    }

    if (event.type === "midi-debug") {
      this.midiRaw = `${event.inputName} ch${event.channel}: ${event.label} -> ${event.role}`;
      this.lastInput = `midi: ${event.label}`;
      this.recordMidiMessage(event);
      this.throttleRender = true;
      return;
    }

    this.lastInput = `${event.source}: reset`;
    this.throttleRender = false;
  }

  render(state: InstrumentState): void {
    this.currentState = state;
    if (this.throttleRender) {
      this.scheduleRender();
      return;
    }

    this.renderNow(state);
  }

  private renderNow(state: InstrumentState): void {
    this.currentState = state;
    const activeLoops = state.activeLoops.map((loop) => loop.name).join(", ") || "none";
    this.root.innerHTML = `
      <div class="debug-header">
        <div>
          <h1 class="debug-title">Visual Instrument V1</h1>
          <p class="debug-kicker">manual controls / live data / MIDI calibration</p>
        </div>
        <span class="debug-badge">1280 x 720</span>
      </div>

      <section class="debug-section debug-status">
        <h2 class="debug-subtitle">Live state</h2>
        <div class="debug-readout">
          <span><b>loops</b>${activeLoops}</span>
          <span><b>last burst</b>${this.lastBurst}</span>
          <span><b>last input</b>${this.lastInput}</span>
          <span><b>midi</b>${this.midiStatus.replace("MIDI: ", "")}</span>
          <span><b>raw</b>${this.midiRaw}</span>
        </div>
      </section>

      <section class="debug-section">
        <h2 class="debug-subtitle">Loop toggles</h2>
        <div class="debug-grid debug-grid-loops">
          ${LOOP_NAMES.map(
            (name, index) => `<button type="button" data-loop="${index}"><span>${index + 1}</span>${name}</button>`
          ).join("")}
        </div>
      </section>

      <section class="debug-section">
        <h2 class="debug-subtitle">Burst triggers</h2>
        <div class="debug-grid debug-grid-bursts">
          ${BURST_NAMES.map(
            (name, index) => `<button type="button" data-burst="${index}"><span>Q${index + 1}</span>${name}</button>`
          ).join("")}
        </div>
      </section>

      <section class="debug-section">
        <h2 class="debug-subtitle">Analog image knobs</h2>
        ${this.renderSliderGroup(state, midiMap.controls.knobControls)}
      </section>

      <section class="debug-section">
        <h2 class="debug-subtitle">Strips / motion</h2>
        ${this.renderSliderGroup(state, midiMap.controls.stripControls)}
      </section>

      <section class="debug-section">
        <h2 class="debug-subtitle">Secondary shaping</h2>
        ${this.renderSliderGroup(state, midiMap.controls.secondaryControls)}
      </section>

      <section class="debug-section midi-monitor">
        <h2 class="debug-subtitle">MIDI calibration</h2>
        <div class="midi-table">
          ${this.renderMidiMessages()}
        </div>
        <div class="midi-learned">
          <span>learned CC:</span>
          ${this.renderLearnedCcSlots()}
        </div>
      </section>

      <div class="debug-grid debug-actions">
        <button type="button" data-midi-connect="true">Connect MIDI</button>
        <button type="button" data-midi-learn-reset="true">Clear MIDI Learn</button>
        <button type="button" data-kill-loops="true">Kill Loops</button>
        <button type="button" data-reset="true">Reset</button>
      </div>
    `;
  }

  private scheduleRender(): void {
    if (!this.currentState || this.queuedRender !== 0) return;

    this.queuedRender = window.setTimeout(() => {
      this.queuedRender = 0;
      if (this.currentState) {
        this.renderNow(this.currentState);
      }
    }, 80);
  }

  private renderSliderGroup(state: InstrumentState, controls: GlobalFXControl[]): string {
    return controls.map((control) => {
      const config = getFXControlConfig(control);
      return this.renderSlider(control, config.label, state.globalFX[control], config.min, config.max, config.step);
    }).join("");
  }

  private renderSlider(
    control: GlobalFXControl,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number
  ): string {
    const percent = ((value - min) / (max - min)) * 100;
    return `
      <label class="debug-slider">
        <span class="debug-slider-label">${label}</span>
        <input
          type="range"
          min="${min}"
          max="${max}"
          step="${step}"
          value="${value}"
          data-fx="${control}"
          style="--slider-fill: ${percent.toFixed(1)}%"
        />
        <span class="debug-slider-value">${value.toFixed(2)}</span>
      </label>
    `;
  }

  private recordMidiMessage(event: Extract<InputEvent, { type: "midi-debug" }>): void {
    if (event.command === 0xb0 && event.role !== "unmapped cc") {
      this.learnedCc.set(event.data1, event.role);
    }

    const message = [
      event.inputName,
      `ch ${event.channel}`,
      `cmd ${event.command}`,
      `d1 ${event.data1}`,
      `d2 ${event.data2}`,
      event.role
    ].join(" | ");

    this.midiMessages.unshift(message);
    this.midiMessages.splice(10);
  }

  private renderMidiMessages(): string {
    if (this.midiMessages.length === 0) {
      return `<div class="midi-row midi-empty">press a MIDI control after connecting</div>`;
    }

    return this.midiMessages.map((message) => `<div class="midi-row">${message}</div>`).join("");
  }

  private renderLearnedCcSlots(): string {
    return [
      this.renderLearnedCcGroup("knobs", midiMap.controls.knobControls),
      this.renderLearnedCcGroup("strips", midiMap.controls.stripControls),
      this.renderLearnedCcGroup("secondary", midiMap.controls.secondaryControls)
    ].join("");
  }

  private renderLearnedCcGroup(label: string, roles: string[]): string {
    return `
      <div class="midi-slot-group">
        <span class="midi-slot-title">${label}</span>
        <div class="midi-slots">
          ${roles
            .map((role, index) => {
              const cc = this.findCcForRole(role);
              const value = cc === null ? "empty" : `CC ${cc}`;
              return `<span class="midi-slot">${index + 1}. ${role}: ${value}</span>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  private findCcForRole(role: string): number | null {
    for (const [cc, learnedRole] of this.learnedCc.entries()) {
      if (learnedRole === role) {
        return cc;
      }
    }

    return null;
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

    if (target.dataset.killLoops) {
      this.router.dispatch({ type: "kill-loops", source: "debug" });
      return;
    }

    if (target.dataset.midiConnect) {
      void this.onMidiConnect();
      return;
    }

    if (target.dataset.midiLearnReset) {
      this.onMidiLearnReset();
    }
  };

  private readonly handleInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const control = target.dataset.fx as GlobalFXControl | undefined;
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
