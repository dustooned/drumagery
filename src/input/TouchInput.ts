import { BURST_COUNT } from "../constants";
import { InputRouter } from "./InputRouter";

interface TouchPoint {
  x: number;
  y: number;
  lastMovedAt: number;
  burstId: number | null;
  screensaverId: number | null;
}

export class TouchInput {
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
    const pressure = getTouchPressure(event);
    const burstId = Math.min(Math.floor(x * BURST_COUNT), BURST_COUNT - 1);
    this.activePointers.set(event.pointerId, {
      x,
      y,
      lastMovedAt: performance.now(),
      burstId,
      screensaverId: burstId
    });

    this.router.dispatch({
      type: "burst",
      source: "touch",
      burstId,
      velocity: 0.75 + Math.min(pressure, 0.25),
      x,
      y
    });
    this.router.dispatch({
      type: "burst-hold-start",
      source: "touch",
      burstId,
      holdKey: `touch:${event.pointerId}`,
      velocity: 0.75 + Math.min(pressure, 0.25),
      pressure,
      x,
      y
    });
    this.router.dispatch({
      type: "screensaver-start",
      source: "touch",
      nodeId: burstId,
      velocity: 0.78 + Math.min(pressure, 0.22),
      x,
      y
    });
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const point = this.activePointers.get(event.pointerId);
    if (!point) return;

    event.preventDefault();
    const { x, y } = this.getNormalizedPosition(event);
    const now = performance.now();
    const movement = getMovementEnergy(point, x, y, now);
    point.x = x;
    point.y = y;
    point.lastMovedAt = now;

    if (point.burstId !== null) {
      this.router.dispatch({
        type: "burst-hold-move",
        source: "touch",
        burstId: point.burstId,
        holdKey: `touch:${event.pointerId}`,
        pressure: getTouchPressure(event),
        movement,
        x,
        y
      });
    }
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    const point = this.activePointers.get(event.pointerId);
    if (point?.burstId !== null && point?.burstId !== undefined) {
      this.router.dispatch({ type: "burst-hold-release", source: "touch", burstId: point.burstId, holdKey: `touch:${event.pointerId}` });
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

function getMovementEnergy(point: TouchPoint, x: number, y: number, now: number): number {
  const elapsedSeconds = Math.max(0.016, (now - point.lastMovedAt) / 1000);
  const distance = Math.hypot(x - point.x, y - point.y);
  return Math.min(1, Math.max(0, distance / elapsedSeconds / 2.4));
}

function getTouchPressure(event: PointerEvent): number {
  if (event.pressure > 0) {
    return Math.min(1, Math.max(0, event.pressure));
  }

  return event.pointerType === "mouse" ? 0.55 : 0.7;
}
