import type { GlobalFXControl } from "../state/types";

export type InputSource = "keyboard" | "touch" | "debug" | "midi";

export type InputEvent =
  | {
      type: "loop-toggle";
      source: InputSource;
      loopId: number;
      velocity: number;
    }
  | {
      type: "burst";
      source: InputSource;
      burstId: number;
      velocity: number;
      x: number;
      y: number;
    }
  | {
      type: "screensaver-start";
      source: InputSource;
      nodeId: number;
      velocity: number;
      x: number;
      y: number;
    }
  | {
      type: "screensaver-release";
      source: InputSource;
      nodeId: number;
    }
  | {
      type: "global-fx";
      source: InputSource;
      control: GlobalFXControl;
      value: number;
    }
  | {
      type: "reset";
      source: InputSource;
    }
  | {
      type: "kill-loops";
      source: InputSource;
    }
  | {
      type: "midi-status";
      source: "midi";
      status: "unsupported" | "requesting" | "ready" | "error";
      message: string;
    }
  | {
      type: "midi-learn-reset";
      source: "midi";
    }
  | {
      type: "midi-debug";
      source: "midi";
      inputName: string;
      command: number;
      channel: number;
      data1: number;
      data2: number;
      label: string;
      role: string;
      normalizedValue?: number;
      postDeadzoneValue?: number;
    };

export type InputListener = (event: InputEvent) => void;
