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
  | "tax"
  | "diceStop"
  | "yourTurn"
  | "auditSlam"
  | "auditWait"
  | "statement"
  | "test"
  | `scene.${SceneSound}`;

export type AudioStatus = "ready" | "locked" | "muted" | "unsupported";

export type SceneSound = "salary" | "tax" | "bank" | "circle" | "rest" | "audit" | "auditExit" | "restart";
export type StepKind = "chuff" | "splash" | "prop" | "flame" | "hoof" | "roll" | "clank" | "pad" | "coin" | "die" | "thud" | "flap";

export interface AudioSettings {
  muted: boolean;
  music: boolean;
  volume: number;
  musicVolume: number;
  sfxVolume: number;
}

const storageKey = "fine.audio.v1";
const tempo = 94;
const eighth = 60 / tempo / 2;
const lookahead = 0.15;
const musicLevel = 0.32;
const sfxLevel = 0.75;

const defaults: AudioSettings = { muted: false, music: true, volume: 0.7, musicVolume: 0.8, sfxVolume: 1 };

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
      volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : defaults.volume,
      musicVolume: typeof parsed.musicVolume === "number" ? Math.min(1, Math.max(0, parsed.musicVolume)) : defaults.musicVolume,
      sfxVolume: typeof parsed.sfxVolume === "number" ? Math.min(1, Math.max(0, parsed.sfxVolume)) : defaults.sfxVolume
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

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

function audioConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null;
}

export function isAppleTouch(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function silentWav(): string {
  const samples = 800;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) bytes[offset + i] = value.charCodeAt(i);
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${window.btoa(binary)}`;
}

const gestureEvents = ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const;

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
  private primed = false;
  private hidden = false;
  private listening = false;
  private keeper: HTMLAudioElement | null = null;
  private retrying = false;
  private listeners = new Set<() => void>();
  settings: AudioSettings = defaults;

  load() {
    this.settings = readAudioSettings();
    return this.settings;
  }

  listen() {
    if (this.listening || typeof document === "undefined") return;
    this.listening = true;
    for (const name of gestureEvents) document.addEventListener(name, this.onGesture, { capture: true, passive: true });
    document.addEventListener("visibilitychange", this.onWake);
    window.addEventListener("pageshow", this.onWake);
    window.addEventListener("focus", this.onWake);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    if (typeof document !== "undefined") document.documentElement.dataset.audio = `${this.status()}:${this.contextState()}`;
    for (const listener of this.listeners) listener();
  }

  /** Number of oscillators and noise sources started since load, exposed for automated checks. */
  scheduled = 0;

  status(): AudioStatus {
    if (!audioConstructor()) return "unsupported";
    if (this.settings.muted) return "muted";
    return this.ctx?.state === "running" ? "ready" : "locked";
  }

  hasPrimed(): boolean {
    return this.primed;
  }

  contextState(): string {
    return this.ctx?.state ?? "none";
  }

  private onGesture = () => {
    if (this.settings.muted) return;
    if (this.primed && this.ctx?.state === "running" && (!this.keeper || !this.keeper.paused)) return;
    this.prime();
  };

  private onWake = () => {
    this.hidden = document.visibilityState === "hidden";
    this.sync();
  };

  private build(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = audioConstructor();
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = this.settings.volume;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(ctx.destination);
    const musicBus = ctx.createGain();
    musicBus.gain.value = this.settings.music ? musicLevel * this.settings.musicVolume : 0;
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxLevel * this.settings.sfxVolume;
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
    ctx.onstatechange = () => {
      if (ctx.state === "running" && this.unlocked && this.settings.music && !this.settings.muted && !this.hidden) this.startMusic();
      this.emit();
    };
    this.listen();
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

  /** Must run synchronously inside a user gesture handler (iOS Safari, Chrome autoplay policy). */
  prime() {
    const ctx = this.build();
    if (!ctx) return;
    const session = (navigator as AudioSessionNavigator).audioSession;
    if (session) {
      try {
        session.type = "playback";
      } catch {
        this.emit();
      }
    }
    if (this.settings.muted) return;
    try {
      const silence = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = silence;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      this.emit();
    }
    if (isAppleTouch() && !session) this.keepSession();
    void ctx.resume().catch(() => undefined).finally(() => this.emit());
    this.primed = true;
    this.sync();
  }

  private keepSession() {
    try {
      if (!this.keeper) {
        const element = document.createElement("audio");
        element.src = silentWav();
        element.loop = true;
        element.preload = "auto";
        element.setAttribute("playsinline", "");
        element.setAttribute("x-webkit-airplay", "deny");
        this.keeper = element;
      }
      if (this.keeper.paused) void this.keeper.play().catch(() => undefined);
    } catch {
      this.keeper = null;
    }
  }

  private sync() {
    const ctx = this.ctx;
    if (!ctx) return;
    const shouldRun = this.primed && !this.settings.muted && !this.hidden;
    if (shouldRun) {
      if (ctx.state !== "running") void ctx.resume().catch(() => undefined);
      if (this.unlocked && this.settings.music) this.startMusic();
      else this.stopMusic();
    } else {
      this.stopMusic();
      this.keeper?.pause();
      if (ctx.state === "running") void ctx.suspend().catch(() => undefined);
    }
    this.emit();
  }

  unlock() {
    this.unlocked = true;
    this.prime();
  }

  /** Plays a short chime from a click handler and reports the real context state afterwards. */
  test(): Promise<AudioStatus> {
    if (this.settings.muted) {
      this.settings = { ...this.settings, muted: false };
      writeAudioSettings(this.settings);
    }
    this.prime();
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(this.status());
    return ctx
      .resume()
      .catch(() => undefined)
      .then(() => {
        this.play("test");
        return new Promise<AudioStatus>(resolve => window.setTimeout(() => resolve(this.status()), 120));
      });
  }

  update(patch: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...patch };
    writeAudioSettings(this.settings);
    const ctx = this.ctx;
    if (ctx && this.master && this.musicBus && this.sfxBus) {
      this.master.gain.setTargetAtTime(this.settings.volume, ctx.currentTime, 0.05);
      this.musicBus.gain.setTargetAtTime(this.settings.music ? musicLevel * this.settings.musicVolume : 0, ctx.currentTime, 0.2);
      this.sfxBus.gain.setTargetAtTime(sfxLevel * this.settings.sfxVolume, ctx.currentTime, 0.05);
    }
    this.sync();
    return this.settings;
  }

  /** Effects requested while the context is suspended (sleep, tab switch, iOS interruption) resume it first. */
  private ready(retry: () => void): boolean {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.settings.muted) return false;
    if (ctx.state === "running") return true;
    if (this.primed && !this.hidden && !this.retrying) {
      this.retrying = true;
      const asked = performance.now();
      void ctx
        .resume()
        .catch(() => undefined)
        .then(() => {
          this.retrying = false;
          if (ctx.state === "running" && performance.now() - asked < 300) retry();
        });
    }
    return false;
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
    this.scheduled += 1;
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
    this.scheduled += 1;
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
    if (!this.ready(() => this.play(name))) return;
    const ctx = this.ctx;
    const out = this.sfxBus;
    if (!ctx || !out) return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case "test":
        this.kalimba(midi(74), t, 0.22, out);
        this.kalimba(midi(81), t + 0.16, 0.18, out);
        break;
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
      case "yourTurn":
        [69, 74, 78, 81].forEach((note, i) => this.kalimba(midi(note), t + i * 0.08, 0.12, out));
        this.coin(2637, t + 0.34, 0.05, out);
        break;
      case "diceStop":
        this.knock(t, 0.3, 1300, out);
        this.knock(t + 0.12, 0.18, 1150, out);
        this.knock(t + 0.2, 0.09, 1000, out);
        this.tone("sine", 70, t, 0.22, 0.25, out, { glide: 45 });
        break;
      case "auditSlam":
        this.knock(t, 0.4, 420, out);
        this.tone("sine", 90, t, 0.3, 0.35, out, { glide: 50 });
        break;
      case "auditWait":
        this.knock(t, 0.12, 2400, out);
        this.knock(t + 0.42, 0.1, 1900, out);
        this.tone("triangle", midi(57), t + 0.1, 0.05, 0.6, out);
        break;
      case "statement":
        this.tone("sine", midi(81), t, 0.06, 0.25, out);
        this.tone("sine", midi(86), t + 0.09, 0.05, 0.35, out);
        this.noiseBurst(t, 0.12, 0.04, out, { type: "bandpass", frequency: 3200, q: 1.2, sweepTo: 5200 });
        break;
      case "scene.salary":
        for (let i = 0; i < 12; i += 1) this.coin(1400 + Math.random() * 1400, t + i * 0.07 + Math.random() * 0.03, 0.06, out);
        [62, 66, 69, 74].forEach((note, i) => this.kalimba(midi(note), t + 0.1 + i * 0.12, 0.1, out));
        break;
      case "scene.tax":
        this.noiseBurst(t + 0.28, 0.09, 0.4, out, { type: "lowpass", frequency: 700 });
        this.tone("sine", 82, t + 0.28, 0.32, 0.3, out, { glide: 48 });
        this.noiseBurst(t + 0.33, 0.12, 0.08, out, { type: "highpass", frequency: 3200 });
        this.tone("triangle", midi(53), t + 0.5, 0.06, 0.6, out);
        break;
      case "scene.bank":
        this.noiseBurst(t, 0.55, 0.09, out, { type: "bandpass", frequency: 260, q: 6, sweepTo: 520 });
        this.knock(t + 0.55, 0.28, 600, out);
        [2093, 2637, 3136].forEach((frequency, i) => this.tone("sine", frequency, t + 0.7 + i * 0.07, 0.04, 0.6, out));
        break;
      case "scene.circle":
        [62, 66, 69, 74, 78].forEach((note, i) => this.kalimba(midi(note), t + i * 0.1, 0.11, out));
        [1568, 1760, 2093].forEach((frequency, i) => this.coin(frequency, t + 0.6 + i * 0.08, 0.07, out));
        break;
      case "scene.rest":
        this.noiseBurst(t, 1.2, 0.05, out, { type: "lowpass", frequency: 500, sweepTo: 1600 });
        [62, 69, 74].forEach(note => this.tone("sine", midi(note), t + 0.3, 0.035, 1.4, out, { attack: 0.4 }));
        break;
      case "scene.audit":
        for (let cycle = 0; cycle < 2; cycle += 1) {
          this.tone("sine", 660, t + cycle * 0.5, 0.06, 0.25, out, { glide: 880 });
          this.tone("sine", 880, t + cycle * 0.5 + 0.25, 0.06, 0.25, out, { glide: 660 });
        }
        [1.05, 1.3, 1.55].forEach(at => this.knock(t + at, 0.32, 380, out));
        break;
      case "scene.auditExit":
        this.noiseBurst(t, 0.7, 0.06, out, { type: "lowpass", frequency: 1800, sweepTo: 300 });
        [62, 66, 69, 74].forEach((note, i) => this.kalimba(midi(note), t + 0.25 + i * 0.07, 0.11, out));
        break;
      case "scene.restart":
        this.noiseBurst(t, 0.12, 0.3, out, { type: "highpass", frequency: 1800 });
        this.noiseBurst(t + 0.05, 1.1, 0.22, out, { type: "lowpass", frequency: 260, sweepTo: 90 });
        this.tone("sine", 55, t + 0.05, 0.25, 0.9, out, { glide: 38 });
        [69, 74, 78, 81].forEach((note, i) => this.kalimba(midi(note), t + 1 + i * 0.1, 0.11, out));
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

  private knock(time: number, peak: number, frequency: number, out: AudioNode) {
    this.noiseBurst(time, 0.05, peak, out, { type: "bandpass", frequency, q: 2.5 });
    this.tone("triangle", frequency * 0.35, time, peak * 0.5, 0.06, out, { glide: frequency * 0.2 });
  }

  step(kind: StepKind, index: number) {
    if (!this.ready(() => this.step(kind, index))) return;
    const ctx = this.ctx;
    const out = this.sfxBus;
    if (!ctx || !out) return;
    const t = ctx.currentTime + 0.01;
    const odd = index % 2 === 1;
    switch (kind) {
      case "chuff":
        this.noiseBurst(t, 0.12, odd ? 0.14 : 0.1, out, { type: "bandpass", frequency: odd ? 900 : 700, q: 1.4, sweepTo: 300 });
        break;
      case "splash":
        this.noiseBurst(t, 0.18, 0.08, out, { type: "bandpass", frequency: 1400, q: 0.8, sweepTo: 600 });
        break;
      case "prop":
        for (let i = 0; i < 4; i += 1) this.noiseBurst(t + i * 0.035, 0.025, 0.06, out, { type: "lowpass", frequency: 900 });
        break;
      case "flame":
        this.noiseBurst(t, 0.2, 0.09, out, { type: "highpass", frequency: 1800, sweepTo: 4200 });
        break;
      case "hoof":
        this.knock(t, 0.12, odd ? 1500 : 1250, out);
        this.knock(t + 0.07, 0.08, 1400, out);
        break;
      case "roll":
        this.noiseBurst(t, 0.14, 0.07, out, { type: "lowpass", frequency: 420 });
        this.tone("triangle", odd ? 520 : 470, t, 0.03, 0.05, out);
        break;
      case "clank":
        this.tone("sine", 1480, t, 0.07, 0.25, out);
        this.tone("sine", 2380, t, 0.04, 0.18, out);
        this.knock(t, 0.08, 900, out);
        break;
      case "pad":
        this.tone("sine", odd ? 220 : 196, t, 0.1, 0.07, out, { glide: 120 });
        break;
      case "coin":
        this.coin(odd ? 2349 : 2093, t, 0.05, out);
        break;
      case "die":
        this.knock(t, 0.1, odd ? 1900 : 1700, out);
        break;
      case "thud":
        this.tone("sine", 72, t, 0.26, 0.2, out, { glide: 45 });
        this.noiseBurst(t, 0.08, 0.06, out, { type: "lowpass", frequency: 300 });
        break;
      case "flap":
        this.noiseBurst(t, 0.05, 0.06, out, { type: "bandpass", frequency: 2200, q: 1 });
        this.noiseBurst(t + 0.06, 0.05, 0.05, out, { type: "bandpass", frequency: 2000, q: 1 });
        break;
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

declare global {
  interface Window {
    fineAudio?: { state: () => string; scheduled: () => number };
  }
}

if (typeof window !== "undefined") window.fineAudio = { state: () => audio.contextState(), scheduled: () => audio.scheduled };
