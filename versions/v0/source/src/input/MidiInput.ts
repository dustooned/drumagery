import { BURST_COUNT, LOOP_COUNT } from "../constants";
import { clamp01 } from "../utils/math";
import { InputRouter } from "./InputRouter";

type MidiMessageHandler = (event: MidiMessageEventLike) => void;

interface MidiAccessLike {
  inputs: {
    size: number;
    values: () => IterableIterator<MidiInputLike>;
  };
  onstatechange: (() => void) | null;
}

interface MidiInputLike {
  name: string | null;
  onmidimessage: MidiMessageHandler | null;
}

interface MidiMessageEventLike {
  currentTarget: MidiInputLike | null;
  data: Uint8Array;
}

interface NavigatorWithMidi {
  requestMIDIAccess?: (options?: { sysex?: boolean }) => Promise<MidiAccessLike>;
}

const KEY_LOOP_BASE_NOTE = 48;
const PAD_BURST_NOTES = [36, 37, 38, 39];
const CC_CONTROLS = ["intensity", "distortion", "hue", "speed"] as const;

export class MidiInput {
  private midiAccess: MidiAccessLike | null = null;
  private requestInFlight = false;
  private readonly learnedCcControls = new Map<number, (typeof CC_CONTROLS)[number]>();

  constructor(private readonly router: InputRouter) {}

  async start(): Promise<void> {
    if (this.requestInFlight) return;

    if (this.midiAccess) {
      this.router.dispatch({
        type: "midi-status",
        source: "midi",
        status: "ready",
        message: `MIDI ready: ${this.midiAccess.inputs.size} input(s).`
      });
      return;
    }

    const midiNavigator = navigator as unknown as NavigatorWithMidi;

    if (!midiNavigator.requestMIDIAccess) {
      this.router.dispatch({
        type: "midi-status",
        source: "midi",
        status: "unsupported",
        message: "Web MIDI unavailable in this browser."
      });
      return;
    }

    this.requestInFlight = true;
    this.router.dispatch({
      type: "midi-status",
      source: "midi",
      status: "requesting",
      message: `Requesting MIDI access. secure=${window.isSecureContext ? "yes" : "no"}`
    });

    try {
      this.midiAccess = await midiNavigator.requestMIDIAccess({ sysex: false });
      this.bindInputs();
      this.midiAccess.onstatechange = () => this.bindInputs();
      this.router.dispatch({
        type: "midi-status",
        source: "midi",
        status: "ready",
        message: `MIDI ready: ${this.midiAccess.inputs.size} input(s).`
      });
    } catch (error) {
      this.router.dispatch({
        type: "midi-status",
        source: "midi",
        status: "error",
        message: describeMidiError(error)
      });
    } finally {
      this.requestInFlight = false;
    }
  }

  private bindInputs(): void {
    if (!this.midiAccess) return;

    for (const input of this.midiAccess.inputs.values()) {
      input.onmidimessage = this.handleMessage;
    }
  }

  private readonly handleMessage = (event: MidiMessageEventLike): void => {
    const [statusByte, data1 = 0, data2 = 0] = event.data;
    const command = statusByte & 0xf0;
    const channel = (statusByte & 0x0f) + 1;
    const inputName = event.currentTarget?.name ?? "MIDI input";
    const label = describeMidi(command, data1, data2);

    this.router.dispatch({
      type: "midi-debug",
      source: "midi",
      inputName,
      command,
      channel,
      data1,
      data2,
      label
    });

    if (command === 0x90 && data2 > 0) {
      this.handleNoteOn(data1, data2);
    }

    if (command === 0xb0) {
      this.handleControlChange(data1, data2);
    }
  };

  private handleNoteOn(note: number, velocityRaw: number): void {
    const velocity = clamp01(velocityRaw / 127);
    const padIndex = PAD_BURST_NOTES.indexOf(note);

    if (padIndex >= 0 && padIndex < BURST_COUNT) {
      this.router.dispatch({
        type: "burst",
        source: "midi",
        burstId: padIndex,
        velocity,
        x: 0.5,
        y: 0.5
      });
      return;
    }

    const loopId = note - KEY_LOOP_BASE_NOTE;
    if (loopId >= 0 && loopId < LOOP_COUNT) {
      this.router.dispatch({ type: "loop-toggle", source: "midi", loopId, velocity });
    }
  }

  private handleControlChange(cc: number, rawValue: number): void {
    const control = this.getControlForCc(cc);
    if (!control) return;

    const normalized = clamp01(rawValue / 127);
    this.router.dispatch({
      type: "global-fx",
      source: "midi",
      control,
      value: control === "speed" ? 0.2 + normalized * 1.8 : normalized
    });
  }

  private getControlForCc(cc: number): (typeof CC_CONTROLS)[number] | null {
    const existing = this.learnedCcControls.get(cc);
    if (existing) return existing;

    if (this.learnedCcControls.size >= CC_CONTROLS.length) {
      return null;
    }

    const control = CC_CONTROLS[this.learnedCcControls.size];
    this.learnedCcControls.set(cc, control);
    return control;
  }
}

function describeMidi(command: number, data1: number, data2: number): string {
  if (command === 0x90 && data2 > 0) return `note ${data1} velocity ${data2}`;
  if (command === 0x80 || (command === 0x90 && data2 === 0)) return `note off ${data1}`;
  if (command === 0xb0) return `cc ${data1} value ${data2}`;
  return `command ${command} data ${data1}/${data2}`;
}

function describeMidiError(error: unknown): string {
  if (error instanceof DOMException) {
    return `${error.name}: ${error.message}`;
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return "MIDI access failed.";
}
