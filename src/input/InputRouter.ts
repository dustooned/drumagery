import type { InputEvent, InputListener } from "./types";

export class InputRouter {
  private listeners = new Set<InputListener>();

  subscribe(listener: InputListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(event: InputEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
