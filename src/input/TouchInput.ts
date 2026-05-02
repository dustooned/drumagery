import { BURST_COUNT, LOOP_COUNT } from "../constants";
import { scaleNormalizedFXControl } from "../state/fxConfig";
import { lerp } from "../utils/math";
import { InputRouter } from "./InputRouter";

interface TouchPoint {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  lastAt: number;
}

export class TouchInput {
  private lastLoopTapAt = 0;
  private readonly activePointers = new Map<number, TouchPoint>();
  private pendingFrame = 0;
  private touchHue = 0.5;
  private touchIntensity = 0.65;
  private touchDistortion = 0;
  private touchScale = 0.5;

  constructor(
    private readonly router: InputRouter,
    private readonly target: HTMLCanvasElement
  ) {}

  start(): void {
    this.target.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    this.target.addEventListener("pointermove", this.handlePointerMove, { passive: false });
    this.target.addEventListener("pointerup", this.handlePointerEnd);
    this.target.addEventListener("pointercancel", this.handlePointerEnd);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen" && event.pointerType !== "mouse") {
      return;
    }

    event.preventDefault();
    this.target.setPointerCapture(event.pointerId);
    const { x, y } = this.getNormalizedPosition(event);
    this.activePointers.set(event.pointerId, {
      x,
      y,
      lastX: x,
      lastY: y,
      lastAt: performance.now()
    });

    const column = Math.min(Math.floor(x * BURST_COUNT), BURST_COUNT - 1);

    if (y < 0.28) {
      const now = performance.now();
      const loopId = Math.min(Math.floor(x * LOOP_COUNT), LOOP_COUNT - 1);
      if (now - this.lastLoopTapAt > 180) {
        this.router.dispatch({ type: "loop-toggle", source: "touch", loopId, velocity: 1 });
      }
      this.lastLoopTapAt = now;
      return;
    }

    this.queueAnalogTouch(event.pointerId);
    this.router.dispatch({
      type: "burst",
      source: "touch",
      burstId: column,
      velocity: 0.75 + Math.min(event.pressure || 0, 0.25),
      x,
      y
    });
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const point = this.activePointers.get(event.pointerId);
    if (!point) return;

    event.preventDefault();
    const { x, y } = this.getNormalizedPosition(event);
    point.lastX = point.x;
    point.lastY = point.y;
    point.x = x;
    point.y = y;
    point.lastAt = performance.now();
    this.queueAnalogTouch(event.pointerId);
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    this.activePointers.delete(event.pointerId);
    if (this.target.hasPointerCapture(event.pointerId)) {
      this.target.releasePointerCapture(event.pointerId);
    }
  };

  private queueAnalogTouch(pointerId: number): void {
    if (this.pendingFrame !== 0) return;

    this.pendingFrame = window.requestAnimationFrame(() => {
      this.pendingFrame = 0;
      this.dispatchAnalogTouch(pointerId);
    });
  }

  private dispatchAnalogTouch(pointerId: number): void {
    const primary = this.activePointers.get(pointerId);
    if (!primary) return;

    const targetHue = scaleNormalizedFXControl("hue", primary.x);
    const targetIntensity = scaleNormalizedFXControl("intensity", 1 - primary.y);
    const movement = Math.hypot(primary.x - primary.lastX, primary.y - primary.lastY);
    const targetDistortion = scaleNormalizedFXControl("distortion", Math.min(1, movement * 18));

    this.touchHue = lerp(this.touchHue, targetHue, 0.32);
    this.touchIntensity = lerp(this.touchIntensity, targetIntensity, 0.32);
    this.touchDistortion = lerp(this.touchDistortion, targetDistortion, 0.22);

    this.router.dispatch({ type: "global-fx", source: "touch", control: "hue", value: this.touchHue });
    this.router.dispatch({ type: "global-fx", source: "touch", control: "intensity", value: this.touchIntensity });
    this.router.dispatch({ type: "global-fx", source: "touch", control: "distortion", value: this.touchDistortion });

    if (this.activePointers.size >= 2) {
      this.dispatchMultiTouchScale();
    }
  }

  private dispatchMultiTouchScale(): void {
    const points = [...this.activePointers.values()];
    const a = points[0];
    const b = points[1];
    if (!a || !b) return;

    const spread = Math.min(1, Math.hypot(a.x - b.x, a.y - b.y) * 1.45);
    this.touchScale = lerp(this.touchScale, scaleNormalizedFXControl("scale", spread), 0.24);
    this.router.dispatch({ type: "global-fx", source: "touch", control: "scale", value: this.touchScale });
  }

  private getNormalizedPosition(event: PointerEvent): { x: number; y: number } {
    const rect = this.target.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
  }
}
