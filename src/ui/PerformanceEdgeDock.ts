import { BURST_NAMES, LOOP_NAMES } from "../constants";
import { InputRouter } from "../input/InputRouter";
import { getFXControlConfig } from "../state/fxConfig";
import type { GlobalFXControl, InstrumentState } from "../state/types";
import { PERFORMANCE_DOCK_CATEGORIES, type DockCategory } from "./performanceDockConfig";

type DockView = "closed" | "categories" | "panel";

interface DockState {
  view: DockView;
  activeCategory: DockCategory | null;
  lastOpenView: "categories" | "panel";
  lastCategory: DockCategory | null;
}

const LOOP_ICONS = ["🌊", "🪩", "🌱", "◇", "⚡"] as const;
const BURST_ICONS = ["✦", "✹", "⚡", "▰"] as const;
const FX_ICONS: Record<GlobalFXControl, string> = {
  intensity: "☀️",
  bloom: "✺",
  distortion: "〰️",
  syncTear: "▤",
  chromaShift: "🌈",
  verticalRoll: "↕️",
  phosphorTrail: "◌",
  syncBands: "▥",
  feedback: "⟲",
  noise: "░",
  density: "▦",
  contrast: "◐",
  chaos: "✣",
  scale: "⤢",
  fade: "◒",
  hue: "🎨",
  speed: "⏩",
  pixelate: "▣",
  burstPower: "💥"
};

export class PerformanceEdgeDock {
  private dockState: DockState = {
    view: "closed",
    activeCategory: null,
    lastOpenView: "categories",
    lastCategory: null
  };
  private currentState: InstrumentState | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly router: InputRouter
  ) {
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("input", this.handleInput);
    this.render();
  }

  render(state: InstrumentState | null = this.currentState): void {
    this.currentState = state;
    const category = this.getActiveCategory();
    this.root.className = `performance-edge-dock is-${this.dockState.view}`;
    this.root.innerHTML = `
      <div class="dock-action-row">
        <button class="dock-reset-button" type="button" data-dock-quick-reset>↺ Reset</button>
        <button
          class="dock-menu-button"
          type="button"
          data-dock-menu
          aria-expanded="${this.dockState.view !== "closed"}"
        >☰ Menu</button>
      </div>
      ${this.dockState.view === "categories" ? this.renderCategories() : ""}
      ${this.dockState.view === "panel" && category ? this.renderPanel(category) : ""}
    `;
  }

  private renderCategories(): string {
    return `
      <div class="dock-popover dock-categories">
        ${PERFORMANCE_DOCK_CATEGORIES.map(
          (category) => `<button type="button" data-dock-category="${category.id}">${category.icon} ${category.label}</button>`
        ).join("")}
      </div>
    `;
  }

  private renderPanel(category: (typeof PERFORMANCE_DOCK_CATEGORIES)[number]): string {
    return `
      <div class="dock-popover dock-panel">
        <div class="dock-panel-header">
          <button type="button" data-dock-back>← Back</button>
          <span>${category.icon} ${category.label}</span>
        </div>
        ${category.id === "play" ? this.renderPlayControls() : ""}
        ${category.controls.map((control) => this.renderFxSlider(control)).join("")}
      </div>
    `;
  }

  private renderPlayControls(): string {
    const activeLoops = new Set((this.currentState?.activeLoops ?? []).map((loop) => loop.id));
    return `
      <div class="dock-play-grid">
        ${LOOP_NAMES.map(
          (name, index) =>
            `<button type="button" data-dock-loop="${index}" aria-pressed="${activeLoops.has(index)}">${LOOP_ICONS[index]} ${index + 1} ${name}</button>`
        ).join("")}
        ${BURST_NAMES.map(
          (name, index) => `<button type="button" data-dock-burst="${index}">${BURST_ICONS[index]} Hit ${index + 1} ${name}</button>`
        ).join("")}
        <button type="button" data-dock-kill>✕ Kill Loops</button>
        <button type="button" data-dock-reset>↺ Reset</button>
      </div>
    `;
  }

  private renderFxSlider(control: GlobalFXControl): string {
    const config = getFXControlConfig(control);
    const value = this.currentState?.globalFX[control] ?? config.defaultValue;
    const percent = ((value - config.min) / (config.max - config.min)) * 100;
    return `
      <label class="dock-slider">
        <span>${FX_ICONS[control]} ${config.label}</span>
        <input
          type="range"
          min="${config.min}"
          max="${config.max}"
          step="${config.step}"
          value="${value}"
          data-dock-fx="${control}"
          style="--slider-fill: ${percent.toFixed(1)}%"
        />
        <b>${value.toFixed(2)}</b>
      </label>
    `;
  }

  private getActiveCategory(): (typeof PERFORMANCE_DOCK_CATEGORIES)[number] | null {
    if (!this.dockState.activeCategory) return null;
    return PERFORMANCE_DOCK_CATEGORIES.find((category) => category.id === this.dockState.activeCategory) ?? null;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest("[data-dock-menu]")) {
      this.toggleMenu();
      return;
    }

    if (target.closest("[data-dock-quick-reset]")) {
      this.router.dispatch({ type: "reset", source: "debug" });
      this.render();
      return;
    }

    const categoryTarget = target.closest<HTMLElement>("[data-dock-category]");
    if (categoryTarget?.dataset.dockCategory) {
      this.openPanel(categoryTarget.dataset.dockCategory as DockCategory);
      return;
    }

    if (target.closest("[data-dock-back]")) {
      this.dockState.view = "categories";
      this.dockState.activeCategory = null;
      this.dockState.lastOpenView = "categories";
      this.render();
      return;
    }

    const loopTarget = target.closest<HTMLElement>("[data-dock-loop]");
    if (loopTarget?.dataset.dockLoop !== undefined) {
      this.router.dispatch({ type: "loop-toggle", source: "debug", loopId: Number(loopTarget.dataset.dockLoop), velocity: 1 });
      return;
    }

    const burstTarget = target.closest<HTMLElement>("[data-dock-burst]");
    if (burstTarget?.dataset.dockBurst !== undefined) {
      this.router.dispatch({
        type: "burst",
        source: "debug",
        burstId: Number(burstTarget.dataset.dockBurst),
        velocity: 0.95,
        x: 0.5,
        y: 0.5
      });
      return;
    }

    if (target.closest("[data-dock-kill]")) {
      this.router.dispatch({ type: "kill-loops", source: "debug" });
      return;
    }

    if (target.closest("[data-dock-reset]")) {
      this.router.dispatch({ type: "reset", source: "debug" });
      this.render();
    }
  };

  private readonly handleInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const control = target.dataset.dockFx as GlobalFXControl | undefined;
    if (!control) return;

    this.router.dispatch({
      type: "global-fx",
      source: "debug",
      control,
      value: Number(target.value)
    });
  };

  private toggleMenu(): void {
    if (this.dockState.view !== "closed") {
      this.dockState.lastOpenView = this.dockState.view === "panel" ? "panel" : "categories";
      this.dockState.lastCategory = this.dockState.activeCategory;
      this.dockState.view = "closed";
      this.dockState.activeCategory = null;
      this.render();
      return;
    }

    this.dockState.view = this.dockState.lastOpenView;
    this.dockState.activeCategory = this.dockState.lastOpenView === "panel" ? this.dockState.lastCategory : null;
    if (this.dockState.view === "panel" && !this.dockState.activeCategory) {
      this.dockState.view = "categories";
    }
    this.render();
  }

  private openPanel(category: DockCategory): void {
    this.dockState.view = "panel";
    this.dockState.activeCategory = category;
    this.dockState.lastOpenView = "panel";
    this.dockState.lastCategory = category;
    this.render();
  }

}
