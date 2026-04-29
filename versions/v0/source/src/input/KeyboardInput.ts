import { BURST_COUNT, LOOP_COUNT } from "../constants";
import { clamp01 } from "../utils/math";
import { InputRouter } from "./InputRouter";

const LOOP_KEYS = ["Digit1", "Digit2", "Digit3", "Digit4"];
const BURST_KEYS = ["KeyQ", "KeyW", "KeyE", "KeyR"];

export class KeyboardInput {
  private hue = 0.5;
  private speed = 1;
  private distortion = 0;
  private intensity = 0.65;

  constructor(private readonly router: InputRouter) {}

  start(): void {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const loopId = LOOP_KEYS.indexOf(event.code);
    if (loopId >= 0 && loopId < LOOP_COUNT) {
      event.preventDefault();
      this.router.dispatch({ type: "loop-toggle", source: "keyboard", loopId, velocity: 1 });
      return;
    }

    const burstId = BURST_KEYS.indexOf(event.code);
    if (burstId >= 0 && burstId < BURST_COUNT) {
      event.preventDefault();
      this.router.dispatch({
        type: "burst",
        source: "keyboard",
        burstId,
        velocity: 0.85,
        x: 0.5,
        y: 0.5
      });
      return;
    }

    if (event.code === "Escape") {
      event.preventDefault();
      this.router.dispatch({ type: "reset", source: "keyboard" });
      return;
    }

    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      event.preventDefault();
      this.hue = wrap01(this.hue + (event.code === "ArrowRight" ? 0.04 : -0.04));
      this.router.dispatch({ type: "global-fx", source: "keyboard", control: "hue", value: this.hue });
    }

    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      event.preventDefault();
      this.speed = clamp01(this.speed / 2 + (event.code === "ArrowUp" ? 0.05 : -0.05)) * 2;
      this.router.dispatch({
        type: "global-fx",
        source: "keyboard",
        control: "speed",
        value: this.speed
      });
    }

    if (event.code === "KeyA" || event.code === "KeyS") {
      event.preventDefault();
      this.distortion = clamp01(this.distortion + (event.code === "KeyS" ? 0.06 : -0.06));
      this.router.dispatch({
        type: "global-fx",
        source: "keyboard",
        control: "distortion",
        value: this.distortion
      });
    }

    if (event.code === "KeyZ" || event.code === "KeyX") {
      event.preventDefault();
      this.intensity = clamp01(this.intensity + (event.code === "KeyX" ? 0.06 : -0.06));
      this.router.dispatch({
        type: "global-fx",
        source: "keyboard",
        control: "intensity",
        value: this.intensity
      });
    }
  };
}

function wrap01(value: number): number {
  return ((value % 1) + 1) % 1;
}
