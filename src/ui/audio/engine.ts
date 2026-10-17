export type Sfx =
  | "click"
  | "dice"
  | "step"
  | "land"
  | "buy"
  | "rentPaid"
  | "rentReceived"
  | "upgrade"
  | "cardFlip"
  | "cardOpportunity"
  | "cardEvent"
  | "loan"
  | "circle"
  | "restart"
  | "victory"
  | "turn"
  | "salary"
  | "tax";

export interface AudioSettings {
  muted: boolean;
  music: boolean;
  volume: number;
}

const storageKey = "fine.audio.v1";
const tempo = 94;
const eighth = 60 / tempo / 2;
const lookahead = 0.15;

const defaults: AudioSettings = { muted: false, music: true, volume: 0.7 };

const chords: Array<{ pad: number[]; bass: number; arp: number[] }> = [
  { pad: [62, 66, 69], bass: 50, arp: [62, 66, 69, 74] },
  { pad: [59, 62, 66], bass: 47, arp: [59, 62, 66, 71] },
  { pad: [55, 59, 62], bass: 43, arp: [55, 59, 62, 67] },
  { pad: [57, 61, 64], bass: 45, arp: [57, 64, 69, 64] }
];

const rest = 0;
const melody: number[][] = [
  [74, rest, 69, rest, 71, 74, rest, rest],
  [71, rest, 66, rest, 69, rest, 66, 64],
  [62, rest, 64, 66, rest, 69, rest, rest],
  [69, rest, 71, rest, 64, rest, rest, rest],
  [78, rest, 76, 74, rest, 69, rest, 74],
  [76, rest, 74, 71, rest, rest, 69, rest],
  [71, rest, 74, rest, 76, 74, 71, rest],
  [69, rest, rest, 64, 66, rest, rest, rest]
];

function midi(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function readAudioSettings(): AudioSettings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      muted: typeof parsed.muted === "boolean" ? parsed.muted : defaults.muted,
      music: typeof parsed.music === "boolean" ? parsed.music : defaults.music,
      volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : defaults.volume
    };
  } catch {
    return defaults;
  }
}

function writeAudioSettings(settings: AudioSettings) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    return;
  }
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private slot = 0;
  private unlocked = false;
  private hidden = false;
  settings: AudioSettings = defaults;

  load() {
    this.settings = readAudioSettings();
    return this.settings;
  }

  private build(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = this.settings.volume;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(ctx.destination);
    const musicBus = ctx.createGain();
    musicBus.gain.value = this.settings.music ? 0.32 : 0;
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.75;
    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(ctx, 2.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    reverb.connect(wet).connect(master);
    const musicSend = ctx.createGain();
    musicSend.gain.value = 0.6;
    const sfxSend = ctx.createGain();
    sfxSend.gain.value = 0.25;
    musicBus.connect(master);
    musicBus.connect(musicSend).connect(reverb);
    sfxBus.connect(master);
    sfxBus.connect(sfxSend).connect(reverb);
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.ctx = ctx;
    this.master = master;
    this.musicBus = musicBus;
    this.sfxBus = sfxBus;
    this.noise = noise;
    document.addEventListener("visibilitychange", this.onVisibility);
    return ctx;
  }

  private impulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    return buffer;
  }

  private onVisibility = () => {
    this.hidden = document.visibilityState === "hidden";
    this.sync();
  };

  private sync() {
    const ctx = this.ctx;
    if (!ctx) return;
    const shouldRun = this.unlocked && !this.settings.muted && !this.hidden;
    if (shouldRun) {
      void ctx.resume().catch(() => undefined);
      if (this.settings.music) this.startMusic();
      else this.stopMusic();
    } else {
      this.stopMusic();
      void ctx.suspend().catch(() => undefined);
    }
  }

  unlock() {
    if (!this.build()) return;
    this.unlocked = true;
    this.sync();
  }

  update(patch: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...patch };
    writeAudioSettings(this.settings);
    const ctx = this.ctx;
    if (ctx && this.master && this.musicBus) {
      this.master.gain.setTargetAtTime(this.settings.volume, ctx.currentTime, 0.05);
      this.musicBus.gain.setTargetAtTime(this.settings.music ? 0.32 : 0, ctx.currentTime, 0.2);
    }
    this.sync();
    return this.settings;
  }

  private startMusic() {
    const ctx = this.ctx;
    if (!ctx || this.timer !== null) return;
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  private stopMusic() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + lookahead) {
      this.playSlot(this.slot, this.nextTime);
      this.slot = (this.slot + 1) % (16 * 8);
      this.nextTime += eighth;
    }
  }

  private playSlot(slot: number, time: number) {
    const bar = Math.floor(slot / 8);
    const step = slot % 8;
    const chord = chords[bar % 4];
    if (!chord || !this.musicBus) return;
    const bus = this.musicBus;
    if (step === 0) {
      this.pad(chord.pad, time, eighth * 8, bus);
      this.bass(chord.bass, time, bus);
    }
    if (step === 4) this.bass(chord.bass, time, bus, 0.6);
    if (bar < 8) {
      const note = melody[bar]?.[step] ?? rest;
      if (note !== rest) this.kalimba(midi(note), time, 0.2, bus);
      if (step === 3 || step === 7) this.marimba(midi((chord.arp[step === 3 ? 1 : 2] ?? 62) - 12), time, 0.07, bus);
    } else {
      const arpNote = chord.arp[step % 4];
      if (arpNote !== undefined && step !== 5) this.marimba(midi(arpNote), time, step === 0 ? 0.13 : 0.09, bus);
      if (step === 2 || step === 6) this.shaker(time, 0.03, bus);
    }
  }

  private envelope(gain: GainNode, time: number, peak: number, decay: number, attack = 0.004) {
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  }

  private tone(type: OscillatorType, frequency: number, time: number, peak: number, decay: number, out: AudioNode, options: { attack?: number; glide?: number } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (options.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.glide), time + decay);
    const gain = ctx.createGain();
    this.envelope(gain, time, peak, decay, options.attack);
    osc.connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + (options.attack ?? 0.004) + decay + 0.05);
  }

  private noiseBurst(time: number, duration: number, peak: number, out: AudioNode, filter: { type: BiquadFilterType; frequency: number; q?: number; sweepTo?: number }) {
    const ctx = this.ctx;
    if (!ctx || !this.noise) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const biquad = ctx.createBiquadFilter();
    biquad.type = filter.type;
    biquad.frequency.setValueAtTime(filter.frequency, time);
    if (filter.sweepTo) biquad.frequency.exponentialRampToValueAtTime(filter.sweepTo, time + duration);
    biquad.Q.value = filter.q ?? 1;
    const gain = ctx.createGain();
    this.envelope(gain, time, peak, duration, 0.003);
    source.connect(biquad).connect(gain).connect(out);
    source.start(time, Math.random() * 0.5);
    source.stop(time + duration + 0.05);
  }

  private kalimba(frequency: number, time: number, peak: number, out: AudioNode) {
    this.tone("sine", frequency, time, peak, 1.3, out);
    this.tone("sine", frequency * 5.95, time, peak * 0.12, 0.12, out);
    this.tone("triangle", frequency * 2, time, peak * 0.08, 0.35, out);
  }

  private marimba(frequency: number, time: number, peak: number, out: AudioNode) {
    this.tone("sine", frequency, time, peak, 0.7, out);
    this.tone("sine", frequency * 3.93, time, peak * 0.22, 0.07, out);
  }

  private pad(notes: number[], time: number, duration: number, out: AudioNode) {
    const ctx = this.ctx;
    if (!ctx) return;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.045, time + 0.8);
    gain.gain.linearRampToValueAtTime(0.03, time + duration - 0.4);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration + 0.3);
    filter.connect(gain).connect(out);
    for (const note of notes) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = midi(note);
        osc.detune.value = detune;
        osc.connect(filter);
        osc.start(time);
        osc.stop(time + duration + 0.4);
      }
    }
  }

  private bass(note: number, time: number, out: AudioNode, level = 1) {
    this.tone("sine", midi(note), time, 0.16 * level, 0.5, out, { attack: 0.01 });
    this.tone("triangle", midi(note) * 2, time, 0.025 * level, 0.18, out);
  }

  private shaker(time: number, peak: number, out: AudioNode) {
    this.noiseBurst(time, 0.06, peak, out, { type: "highpass", frequency: 6500 });
  }

  private coin(frequency: number, time: number, peak: number, out: AudioNode) {
    this.tone("sine", frequency, time, peak, 0.35, out);
    this.tone("sine", frequency * 2.76, time, peak * 0.35, 0.16, out);
    this.tone("sine", frequency * 5.4, time, peak * 0.15, 0.06, out);
  }

  play(name: Sfx) {
    const ctx = this.ctx;
    const out = this.sfxBus;
    if (!ctx || !out || this.settings.muted || ctx.state !== "running") return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case "click":
        this.tone("sine", 880, t, 0.06, 0.05, out, { glide: 660 });
        break;
      case "step":
        this.tone("triangle", 1250, t, 0.09, 0.05, out, { glide: 800 });
        this.noiseBurst(t, 0.02, 0.04, out, { type: "bandpass", frequency: 3000, q: 3 });
        break;
      case "land":
        this.marimba(midi(69), t, 0.14, out);
        this.marimba(midi(74), t + 0.08, 0.12, out);
        break;
      case "dice": {
        for (let i = 0; i < 11; i += 1) {
          const at = t + i * 0.085 + Math.random() * 0.03;
          this.noiseBurst(at, 0.03, 0.18 - i * 0.008, out, { type: "bandpass", frequency: 1800 + Math.random() * 1600, q: 4 });
          this.tone("triangle", 700 + Math.random() * 500, at, 0.03, 0.03, out);
        }
        this.noiseBurst(t, 0.95, 0.05, out, { type: "bandpass", frequency: 2500, q: 0.7 });
        for (const at of [t + 1.02, t + 1.11]) {
          this.noiseBurst(at, 0.05, 0.3, out, { type: "bandpass", frequency: 1300, q: 2 });
          this.tone("sine", 260, at, 0.18, 0.09, out, { glide: 120 });
        }
        break;
      }
      case "buy":
        [1568, 1760, 2093, 2349].forEach((frequency, i) => this.coin(frequency, t + i * 0.07, 0.11, out));
        this.noiseBurst(t, 0.18, 0.05, out, { type: "highpass", frequency: 5000 });
        break;
      case "rentPaid":
        [2093, 1760, 1397, 1175].forEach((frequency, i) => this.coin(frequency, t + i * 0.09, 0.1, out));
        break;
      case "rentReceived":
        [1175, 1397, 1760, 2093].forEach((frequency, i) => this.coin(frequency, t + i * 0.09, 0.1, out));
        break;
      case "salary":
        [1397, 1760, 2093].forEach((frequency, i) => this.coin(frequency, t + i * 0.06, 0.09, out));
        this.kalimba(midi(74), t + 0.2, 0.12, out);
        this.kalimba(midi(78), t + 0.32, 0.12, out);
        break;
      case "tax":
        this.tone("triangle", midi(57), t, 0.09, 0.3, out);
        this.tone("triangle", midi(53), t + 0.16, 0.09, 0.45, out);
        break;
      case "upgrade":
        [523, 659, 784, 1047].forEach((frequency, i) => this.tone("triangle", frequency, t + i * 0.07, 0.11, 0.3, out));
        this.coin(2637, t + 0.32, 0.07, out);
        break;
      case "cardFlip":
        this.noiseBurst(t, 0.28, 0.16, out, { type: "bandpass", frequency: 700, q: 0.9, sweepTo: 4200 });
        break;
      case "cardOpportunity":
        this.noiseBurst(t, 0.28, 0.14, out, { type: "bandpass", frequency: 700, q: 0.9, sweepTo: 4200 });
        [2637, 3136, 3520, 4186].forEach((frequency, i) => this.tone("sine", frequency, t + 0.22 + i * 0.05, 0.05, 0.25, out));
        [62, 66, 69, 74].forEach((note, i) => this.kalimba(midi(note), t + 0.3 + i * 0.06, 0.13, out));
        break;
      case "cardEvent":
        this.noiseBurst(t, 0.28, 0.14, out, { type: "bandpass", frequency: 700, q: 0.9, sweepTo: 4200 });
        this.tone("sine", 98, t + 0.25, 0.22, 0.9, out, { glide: 82 });
        this.kalimba(midi(57), t + 0.3, 0.12, out);
        this.kalimba(midi(60), t + 0.42, 0.11, out);
        break;
      case "loan":
        this.tone("sine", 130, t, 0.22, 0.18, out, { glide: 60 });
        this.noiseBurst(t, 0.06, 0.12, out, { type: "lowpass", frequency: 900 });
        this.marimba(midi(69), t + 0.14, 0.12, out);
        this.marimba(midi(62), t + 0.26, 0.12, out);
        break;
      case "circle":
        [62, 66, 69, 74, 78].forEach((note, i) => this.kalimba(midi(note), t + i * 0.09, 0.12, out));
        break;
      case "restart":
        this.tone("sawtooth", 440, t, 0.05, 0.6, out, { glide: 196 });
        this.kalimba(midi(62), t + 0.75, 0.13, out);
        this.kalimba(midi(69), t + 0.95, 0.13, out);
        this.kalimba(midi(74), t + 1.15, 0.13, out);
        break;
      case "turn":
        this.kalimba(midi(74), t, 0.1, out);
        this.kalimba(midi(81), t + 0.12, 0.08, out);
        break;
      case "victory": {
        const hits: Array<[number, number[], number]> = [
          [0, [62, 66, 69], 0.22],
          [0.26, [67, 71, 74], 0.22],
          [0.52, [69, 73, 76], 0.22],
          [0.86, [74, 78, 81], 1.4]
        ];
        for (const [offset, notes, length] of hits) {
          for (const note of notes) {
            this.brass(midi(note), t + offset, length, out);
          }
          this.tone("sine", 82, t + offset, 0.2, 0.3, out, { glide: 55 });
        }
        [86, 88, 90, 93].forEach((note, i) => this.tone("sine", midi(note), t + 1 + i * 0.08, 0.04, 0.4, out));
        break;
      }
    }
  }

  private brass(frequency: number, time: number, length: number, out: AudioNode) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = frequency;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.linearRampToValueAtTime(2600, time + 0.06);
    filter.frequency.exponentialRampToValueAtTime(900, time + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 0.04);
    gain.gain.setValueAtTime(0.045, time + length * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.1);
    osc.connect(filter).connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + length + 0.2);
  }
}

export const audio = new AudioEngine();
