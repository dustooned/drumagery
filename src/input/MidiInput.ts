import { BURST_COUNT, LOOP_COUNT } from "../constants";
import { scaleNormalizedFXControl } from "../state/fxConfig";
import { clamp01 } from "../utils/math";
import { InputRouter } from "./InputRouter";
import { MIDI_ZERO_DEADZONE, midiMap, noteToBurstId, noteToLoopId, noteToScreensaverId } from "./midiMap";

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

export class MidiInput {
  private midiAccess: MidiAccessLike | null = null;
  private requestInFlight = false;
  private readonly learnedCcControls = new Map<number, (typeof midiMap.controls.learnedControls)[number]>();

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

  resetLearnedControls(): void {
    this.learnedCcControls.clear();
    this.router.dispatch({ type: "midi-learn-reset", source: "midi" });
    this.router.dispatch({
      type: "midi-status",
      source: "midi",
      status: this.midiAccess ? "ready" : "requesting",
      message: this.midiAccess ? "MIDI CC learning reset." : "MIDI CC learning reset. Connect MIDI to learn again."
    });
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
    const isPitchBendVerticalRoll = command === 0xe0 && channel === 1;
    const role = command === 0xb0
      ? this.learnControlForCc(data1) ?? "unmapped cc"
      : isPitchBendVerticalRoll
        ? "verticalRoll"
        : this.getMidiRole(command, data1, data2, channel);
    const normalizedValue = command === 0xb0 || isPitchBendVerticalRoll ? clamp01(data2 / 127) : undefined;
    const postDeadzoneValue = normalizedValue === undefined ? undefined : applyMidiDeadzone(normalizedValue);

    this.router.dispatch({
      type: "midi-debug",
      source: "midi",
      inputName,
      command,
      channel,
      data1,
      data2,
      label,
      role,
      normalizedValue,
      postDeadzoneValue
    });

    if (command === 0x90 && data2 > 0) {
      this.handleNoteOn(data1, data2);
    }

    if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      this.handleNoteOff(data1);
    }

    if (command === 0xb0) {
      this.handleControlChange(data1, postDeadzoneValue ?? 0);
    }

    if (isPitchBendVerticalRoll) {
      this.router.dispatch({
        type: "global-fx",
        source: "midi",
        control: "verticalRoll",
        value: scaleNormalizedFXControl("verticalRoll", postDeadzoneValue ?? 0)
      });
    }
  };

  private handleNoteOn(note: number, velocityRaw: number): void {
    const velocity = clamp01(velocityRaw / 127);
    const padIndex = noteToBurstId(note);

    if (padIndex !== null && padIndex >= 0 && padIndex < BURST_COUNT) {
      this.router.dispatch({
        type: "burst",
        source: "midi",
        burstId: padIndex,
        velocity,
        x: 0.5,
        y: 0.5
      });
      this.router.dispatch({
        type: "burst-hold-start",
        source: "midi",
        burstId: padIndex,
        velocity,
        pressure: velocity,
        x: 0.5,
        y: 0.5
      });
      return;
    }

    const loopId = noteToLoopId(note);
    if (loopId !== null && loopId >= 0 && loopId < LOOP_COUNT) {
      this.router.dispatch({ type: "loop-toggle", source: "midi", loopId, velocity });
      return;
    }

    const screensaverId = noteToScreensaverId(note);
    if (screensaverId !== null && screensaverId >= 0 && screensaverId < BURST_COUNT) {
      this.router.dispatch({
        type: "screensaver-start",
        source: "midi",
        nodeId: screensaverId,
        velocity,
        x: 0.5,
        y: 0.5
      });
    }
  }

  private handleNoteOff(note: number): void {
    const padIndex = noteToBurstId(note);
    if (padIndex !== null && padIndex >= 0 && padIndex < BURST_COUNT) {
      this.router.dispatch({ type: "burst-hold-release", source: "midi", burstId: padIndex });
      return;
    }

    const screensaverId = noteToScreensaverId(note);
    if (screensaverId !== null && screensaverId >= 0 && screensaverId < BURST_COUNT) {
      this.router.dispatch({ type: "screensaver-release", source: "midi", nodeId: screensaverId });
    }
  }

  private handleControlChange(cc: number, normalizedValue: number): void {
    const control = this.learnedCcControls.get(cc);
    if (!control) return;

    this.router.dispatch({
      type: "global-fx",
      source: "midi",
      control,
      value: scaleNormalizedFXControl(control, normalizedValue)
    });
  }

  private learnControlForCc(cc: number): (typeof midiMap.controls.learnedControls)[number] | null {
    const existing = this.learnedCcControls.get(cc);
    if (existing) return existing;

    if (this.learnedCcControls.size >= midiMap.controls.learnedControls.length) {
      return null;
    }

    const control = midiMap.controls.learnedControls[this.learnedCcControls.size];
    this.learnedCcControls.set(cc, control);
    return control;
  }

  private getMidiRole(command: number, data1: number, data2: number, channel: number): string {
    if (command === 0x90 && data2 > 0) {
      const burstId = noteToBurstId(data1);
      if (burstId !== null) return `drum pad burst ${burstId + 1}`;

      const loopId = noteToLoopId(data1);
      if (loopId !== null) return `white-key sequence loop ${loopId + 1}`;

      const screensaverId = noteToScreensaverId(data1);
      if (screensaverId !== null) return `black-key screensaver ${screensaverId + 1}`;

      return "unmapped note";
    }

    if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      const screensaverId = noteToScreensaverId(data1);
      if (screensaverId !== null) return `black-key screensaver ${screensaverId + 1} release`;
      return "note off";
    }

    if (command === 0xb0) {
      return this.learnedCcControls.get(data1) ?? "unmapped cc";
    }

    if (command === 0xe0 && channel === 1) {
      return "verticalRoll";
    }

    return "unmapped";
  }
}

function applyMidiDeadzone(value: number): number {
  return value < MIDI_ZERO_DEADZONE ? 0 : value;
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
