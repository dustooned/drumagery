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

if (!stageElement || !debugElement) {
  throw new Error("Missing required stage or debug-panel element.");
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
const debugPanel = new DebugPanel(debugElement, inputRouter, () => midiInput.start());

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
