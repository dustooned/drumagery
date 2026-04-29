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
      type: "global-fx";
      source: InputSource;
      control: "hue" | "speed" | "distortion" | "intensity";
      value: number;
    }
  | {
      type: "reset";
      source: InputSource;
    }
  | {
      type: "midi-status";
      source: "midi";
      status: "unsupported" | "requesting" | "ready" | "error";
      message: string;
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
    };

export type InputListener = (event: InputEvent) => void;
