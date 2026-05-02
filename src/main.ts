import { Application } from "pixi.js";
import "./style.css";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "./constants";
import { InputRouter } from "./input/InputRouter";
import { KeyboardInput } from "./input/KeyboardInput";
import { MidiInput } from "./input/MidiInput";
import { TouchInput } from "./input/TouchInput";
import { StateEngine } from "./state/StateEngine";
import { DebugPanel } from "./ui/DebugPanel";
import { VisualEngine } from "./visuals/VisualEngine";

const stageElement = document.querySelector<HTMLDivElement>("#stage");
const debugElement = document.querySelector<HTMLElement>("#debug-panel");
const appElement = document.querySelector<HTMLElement>("#app");
const debugToggleElement = document.querySelector<HTMLButtonElement>("#debug-toggle");
const midiConnectElement = document.querySelector<HTMLButtonElement>("#midi-connect");
const midiLearnResetElement = document.querySelector<HTMLButtonElement>("#midi-learn-reset");
const killLoopsElement = document.querySelector<HTMLButtonElement>("#kill-loops");
const resetStateElement = document.querySelector<HTMLButtonElement>("#reset-state");
const fullscreenToggleElement = document.querySelector<HTMLButtonElement>("#fullscreen-toggle");

if (
  !stageElement ||
  !debugElement ||
  !appElement ||
  !debugToggleElement ||
  !midiConnectElement ||
  !midiLearnResetElement ||
  !killLoopsElement ||
  !resetStateElement ||
  !fullscreenToggleElement
) {
  throw new Error("Missing required app, stage, debug-panel, or action control element.");
}

const app = new Application({
  width: INTERNAL_WIDTH,
  height: INTERNAL_HEIGHT,
  backgroundColor: 0x050607,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2)
});

stageElement.appendChild(app.view as HTMLCanvasElement);

const inputRouter = new InputRouter();
const stateEngine = new StateEngine();
const visualEngine = new VisualEngine(app.stage);
const keyboardInput = new KeyboardInput(inputRouter);
const touchInput = new TouchInput(inputRouter, app.view as HTMLCanvasElement);
const midiInput = new MidiInput(inputRouter);
const debugPanel = new DebugPanel(debugElement, inputRouter);

const setDebugPanelVisible = (visible: boolean): void => {
  appElement.classList.toggle("is-debug-hidden", !visible);
  debugToggleElement.textContent = visible ? "Hide controls" : "Show controls";
  debugToggleElement.setAttribute("aria-expanded", String(visible));
  debugToggleElement.setAttribute("aria-label", visible ? "Hide debug controls" : "Show debug controls");
};

setDebugPanelVisible(true);

debugToggleElement.addEventListener("click", () => {
  setDebugPanelVisible(appElement.classList.contains("is-debug-hidden"));
});

midiConnectElement.addEventListener("click", () => {
  void midiInput.start();
});

midiLearnResetElement.addEventListener("click", () => {
  midiInput.resetLearnedControls();
});

killLoopsElement.addEventListener("click", () => {
  inputRouter.dispatch({ type: "kill-loops", source: "debug" });
});

resetStateElement.addEventListener("click", () => {
  inputRouter.dispatch({ type: "reset", source: "debug" });
});

const setFullscreenButtonState = (): void => {
  const isFullscreen = document.fullscreenElement === stageElement;
  fullscreenToggleElement.textContent = isFullscreen ? "Exit fullscreen" : "Fullscreen";
  fullscreenToggleElement.setAttribute("aria-pressed", String(isFullscreen));
};

fullscreenToggleElement.addEventListener("click", () => {
  if (document.fullscreenElement === stageElement) {
    void document.exitFullscreen();
    return;
  }

  if (stageElement.requestFullscreen) {
    void stageElement.requestFullscreen();
  }
});

document.addEventListener("fullscreenchange", setFullscreenButtonState);
setFullscreenButtonState();

inputRouter.subscribe((inputEvent) => {
  debugPanel.recordInput(inputEvent);
  stateEngine.handleInput(inputEvent);
});

stateEngine.subscribe((state) => {
  visualEngine.syncState(state);
  debugPanel.render(state);
});

app.ticker.add((deltaFrames) => {
  const deltaSeconds = deltaFrames / 60;
  const bursts = stateEngine.drainBurstQueue();
  visualEngine.update(deltaSeconds, bursts);
});

keyboardInput.start();
touchInput.start();
debugPanel.render(stateEngine.getState());
