import { BURST_COUNT, LOOP_COUNT } from "../constants";
import { InputRouter } from "./InputRouter";

interface TouchPoint {
  x: number;
  y: number;
  burstId: number | null;
  screensaverId: number | null;
}

export class TouchInput {
  private lastLoopTapAt = 0;
  private readonly activePointers = new Map<number, TouchPoint>();

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
    const burstId = y >= 0.28 ? Math.min(Math.floor(x * BURST_COUNT), BURST_COUNT - 1) : null;
    this.activePointers.set(event.pointerId, {
      x,
      y,
      burstId,
      screensaverId: burstId
    });

    if (y < 0.28) {
      const now = performance.now();
      const loopId = Math.min(Math.floor(x * LOOP_COUNT), LOOP_COUNT - 1);
      if (now - this.lastLoopTapAt > 180) {
        this.router.dispatch({ type: "loop-toggle", source: "touch", loopId, velocity: 1 });
      }
      this.lastLoopTapAt = now;
      return;
    }

    if (burstId === null) return;

    this.router.dispatch({
      type: "burst",
      source: "touch",
      burstId,
      velocity: 0.75 + Math.min(event.pressure || 0, 0.25),
      x,
      y
    });
    this.router.dispatch({
      type: "burst-hold-start",
      source: "touch",
      burstId,
      velocity: 0.75 + Math.min(event.pressure || 0, 0.25),
      x,
      y
    });
    this.router.dispatch({
      type: "screensaver-start",
      source: "touch",
      nodeId: burstId,
      velocity: 0.78 + Math.min(event.pressure || 0, 0.22),
      x,
      y
    });
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const point = this.activePointers.get(event.pointerId);
    if (!point) return;

    event.preventDefault();
    const { x, y } = this.getNormalizedPosition(event);
    point.x = x;
    point.y = y;
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    const point = this.activePointers.get(event.pointerId);
    if (point?.burstId !== null && point?.burstId !== undefined) {
      this.router.dispatch({ type: "burst-hold-release", source: "touch", burstId: point.burstId });
    }
    if (point?.screensaverId !== null && point?.screensaverId !== undefined) {
      this.router.dispatch({ type: "screensaver-release", source: "touch", nodeId: point.screensaverId });
    }
    this.activePointers.delete(event.pointerId);
    if (this.target.hasPointerCapture(event.pointerId)) {
      this.target.releasePointerCapture(event.pointerId);
    }
  };

  private getNormalizedPosition(event: PointerEvent): { x: number; y: number } {
    const rect = this.target.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
  }
}
