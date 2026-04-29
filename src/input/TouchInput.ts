import { BURST_COUNT, LOOP_COUNT } from "../constants";
import { InputRouter } from "./InputRouter";

export class TouchInput {
  private lastLoopTapAt = 0;

  constructor(
    private readonly router: InputRouter,
    private readonly target: HTMLCanvasElement
  ) {}

  start(): void {
    this.target.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen" && event.pointerType !== "mouse") {
      return;
    }

    event.preventDefault();
    const rect = this.target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
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

    this.router.dispatch({
      type: "burst",
      source: "touch",
      burstId: column,
      velocity: 0.75 + Math.min(event.pressure || 0, 0.25),
      x,
      y
    });
  };
}
