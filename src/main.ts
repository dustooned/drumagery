import { Application, Container } from "pixi.js";
import "./style.css";
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from "./constants";
import { InputRouter } from "./input/InputRouter";
import { KeyboardInput } from "./input/KeyboardInput";
import { MidiInput } from "./input/MidiInput";
import { TouchInput } from "./input/TouchInput";
import { StateEngine } from "./state/StateEngine";
import { DebugPanel } from "./ui/DebugPanel";
import { PerformanceEdgeDock } from "./ui/PerformanceEdgeDock";
import { VisualEngine } from "./visuals/VisualEngine";

const stageElement = document.querySelector<HTMLDivElement>("#stage");
const debugElement = document.querySelector<HTMLElement>("#debug-panel");
const dockElement = document.querySelector<HTMLElement>("#performance-edge-dock");
const appElement = document.querySelector<HTMLElement>("#app");
const debugToggleElement = document.querySelector<HTMLButtonElement>("#debug-toggle");
const midiConnectElement = document.querySelector<HTMLButtonElement>("#midi-connect");
const midiLearnResetElement = document.querySelector<HTMLButtonElement>("#midi-learn-reset");
const killLoopsElement = document.querySelector<HTMLButtonElement>("#kill-loops");
const resetStateElement = document.querySelector<HTMLButtonElement>("#reset-state");
const mobileGridToggleElement = document.querySelector<HTMLButtonElement>("#mobile-grid-toggle");
const fullscreenToggleElement = document.querySelector<HTMLButtonElement>("#fullscreen-toggle");
const fullscreenExitElement = document.querySelector<HTMLButtonElement>("#fullscreen-exit");
const desktopWallpaperUrl = `${import.meta.env.BASE_URL}wallpapers/xp-desktop/xp-desktop.png`;

if (
  !stageElement ||
  !debugElement ||
  !dockElement ||
  !appElement ||
  !debugToggleElement ||
  !midiConnectElement ||
  !midiLearnResetElement ||
  !killLoopsElement ||
  !resetStateElement ||
  !mobileGridToggleElement ||
  !fullscreenToggleElement ||
  !fullscreenExitElement
) {
  throw new Error("Missing required app, stage, debug-panel, or action control element.");
}

document.documentElement.style.setProperty("--desktop-wallpaper-url", `url("${desktopWallpaperUrl}")`);

const app = new Application({
  width: INTERNAL_WIDTH,
  height: INTERNAL_HEIGHT,
  backgroundColor: 0x050607,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2)
});

stageElement.appendChild(app.view as HTMLCanvasElement);
const canvasElement = app.view as HTMLCanvasElement;
const sceneRoot = new Container();
app.stage.addChild(sceneRoot);

const inputRouter = new InputRouter();
const stateEngine = new StateEngine();
const visualEngine = new VisualEngine(sceneRoot);
const keyboardInput = new KeyboardInput(inputRouter);
const touchInput = new TouchInput(inputRouter, canvasElement);
const midiInput = new MidiInput(inputRouter);
const debugPanel = new DebugPanel(debugElement, inputRouter);
const performanceEdgeDock = new PerformanceEdgeDock(dockElement, inputRouter);

const resizeVisualStage = (): void => {
  const bounds = canvasElement.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const scale = Math.max(width / INTERNAL_WIDTH, height / INTERNAL_HEIGHT);

  app.renderer.resize(width, height);
  canvasElement.style.width = "100%";
  canvasElement.style.height = "100%";
  visualEngine.setPresentationSize(width, height);
  sceneRoot.scale.set(scale);
  sceneRoot.position.set((width - INTERNAL_WIDTH * scale) * 0.5, (height - INTERNAL_HEIGHT * scale) * 0.5);
};

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

const setMobileGridMode = (enabled: boolean): void => {
  appElement.classList.toggle("is-mobile-grid-mode", enabled);
  stageElement.classList.toggle("is-stage-fullscreen", enabled);
  mobileGridToggleElement.textContent = enabled ? "Small grid" : "Big grid";
  mobileGridToggleElement.setAttribute("aria-pressed", String(enabled));
  window.requestAnimationFrame(resizeVisualStage);
};

mobileGridToggleElement.addEventListener("click", () => {
  setMobileGridMode(!appElement.classList.contains("is-mobile-grid-mode"));
});

const setFullscreenButtonState = (): void => {
  const isFullscreen = document.fullscreenElement === stageElement;
  const isMobileGridMode = appElement.classList.contains("is-mobile-grid-mode");
  stageElement.classList.toggle("is-stage-fullscreen", isFullscreen || isMobileGridMode);
  fullscreenToggleElement.textContent = isFullscreen ? "Exit fullscreen" : "Fullscreen";
  fullscreenToggleElement.setAttribute("aria-pressed", String(isFullscreen));
  fullscreenExitElement.setAttribute("aria-hidden", String(!isFullscreen));
  window.requestAnimationFrame(resizeVisualStage);
};

fullscreenToggleElement.addEventListener("click", () => {
  if (document.fullscreenElement === stageElement) {
    void document.exitFullscreen();
    return;
  }

  if (stageElement.requestFullscreen) {
    void stageElement.requestFullscreen().catch(() => {
      setMobileGridMode(true);
    });
    return;
  }

  setMobileGridMode(true);
});

fullscreenExitElement.addEventListener("click", () => {
  if (document.fullscreenElement === stageElement) {
    void document.exitFullscreen();
    return;
  }

  if (appElement.classList.contains("is-mobile-grid-mode")) {
    setMobileGridMode(false);
    return;
  }
});

document.addEventListener("fullscreenchange", setFullscreenButtonState);
window.addEventListener("resize", resizeVisualStage);
setFullscreenButtonState();

inputRouter.subscribe((inputEvent) => {
  debugPanel.recordInput(inputEvent);
  stateEngine.handleInput(inputEvent);
});

stateEngine.subscribe((state) => {
  visualEngine.syncState(state);
  debugPanel.render(state);
  performanceEdgeDock.render(state);
});

app.ticker.add((deltaFrames) => {
  const deltaSeconds = deltaFrames / 60;
  const bursts = stateEngine.drainBurstQueue();
  visualEngine.update(deltaSeconds, bursts);
});

keyboardInput.start();
touchInput.start();
debugPanel.render(stateEngine.getState());
performanceEdgeDock.render(stateEngine.getState());
resizeVisualStage();
