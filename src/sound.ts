// Tiny synthesized sound engine — no audio files (keeps the static build asset-free).
// Each sound is a short sequence of oscillator blips with an envelope. A mute toggle
// is persisted in localStorage. The AudioContext is created lazily on the first call
// (which happens inside a user gesture, satisfying browser autoplay policies).

const MUTE_KEY = "gym_incremental_muted";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = localStorage.getItem(MUTE_KEY) === "1";

function audio(): { ctx: AudioContext; master: GainNode } | null {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35; // keep overall volume gentle
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return { ctx, master: master! };
}

interface Blip {
  freq: number;
  start: number; // seconds from now
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number; // glide the pitch to this frequency
}

function play(blips: Blip[]) {
  const a = audio();
  if (!a) return;
  const t0 = a.ctx.currentTime;
  for (const b of blips) {
    const o = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    o.type = b.type ?? "sine";
    const at = t0 + b.start;
    o.frequency.setValueAtTime(b.freq, at);
    if (b.slideTo) o.frequency.exponentialRampToValueAtTime(b.slideTo, at + b.dur);
    const peak = b.gain ?? 0.2;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + b.dur);
    o.connect(g).connect(a.master);
    o.start(at);
    o.stop(at + b.dur + 0.02);
  }
}

// Note helper (equal temperament, A4 = 440)
const N = (semitonesFromA4: number) => 440 * Math.pow(2, semitonesFromA4 / 12);

export type SoundName =
  | "click"
  | "set"
  | "levelup"
  | "buy"
  | "coin"
  | "achieve"
  | "win"
  | "lose"
  | "thud"
  | "heal"
  | "epic";

const SOUNDS: Record<SoundName, () => Blip[]> = {
  // subtle tactile tick for a manual rep
  click: () => [{ freq: 320, start: 0, dur: 0.04, type: "square", gain: 0.06, slideTo: 220 }],
  // satisfying two-note "ding-ding" when a set completes
  set: () => [
    { freq: N(7), start: 0, dur: 0.1, type: "triangle", gain: 0.18 },
    { freq: N(12), start: 0.09, dur: 0.16, type: "triangle", gain: 0.2 },
  ],
  // rising arpeggio for a level-up
  levelup: () => [3, 7, 10, 15].map((s, i) => ({ freq: N(s), start: i * 0.07, dur: 0.14, type: "triangle", gain: 0.18 })),
  buy: () => [{ freq: N(-2), start: 0, dur: 0.06, type: "square", gain: 0.12, slideTo: N(5) }],
  // classic two-blip coin for money earned
  coin: () => [
    { freq: N(14), start: 0, dur: 0.06, type: "square", gain: 0.12 },
    { freq: N(19), start: 0.06, dur: 0.12, type: "square", gain: 0.12 },
  ],
  achieve: () => [N(12), N(16), N(19)].map((f, i) => ({ freq: f, start: i * 0.06, dur: 0.12, type: "sine", gain: 0.16 })),
  // short fanfare on a competition win
  win: () => [
    { freq: N(3), start: 0, dur: 0.12, type: "triangle", gain: 0.2 },
    { freq: N(7), start: 0.1, dur: 0.12, type: "triangle", gain: 0.2 },
    { freq: N(10), start: 0.2, dur: 0.12, type: "triangle", gain: 0.2 },
    { freq: N(15), start: 0.3, dur: 0.28, type: "triangle", gain: 0.22 },
  ],
  // descending "aww" on a loss
  lose: () => [
    { freq: N(2), start: 0, dur: 0.18, type: "sawtooth", gain: 0.12 },
    { freq: N(-3), start: 0.16, dur: 0.28, type: "sawtooth", gain: 0.12, slideTo: N(-8) },
  ],
  // low thud for an emergency collapse
  thud: () => [{ freq: 140, start: 0, dur: 0.22, type: "sine", gain: 0.28, slideTo: 60 }],
  heal: () => [{ freq: N(0), start: 0, dur: 0.22, type: "sine", gain: 0.16, slideTo: N(12) }],
  // bigger fanfare for an Arnold / Endless milestone
  epic: () => [
    { freq: N(3), start: 0, dur: 0.14, type: "triangle", gain: 0.22 },
    { freq: N(10), start: 0.12, dur: 0.14, type: "triangle", gain: 0.22 },
    { freq: N(15), start: 0.24, dur: 0.14, type: "triangle", gain: 0.22 },
    { freq: N(19), start: 0.36, dur: 0.14, type: "triangle", gain: 0.22 },
    { freq: N(22), start: 0.48, dur: 0.4, type: "triangle", gain: 0.26 },
  ],
};

export function playSound(name: SoundName) {
  SOUNDS[name] && play(SOUNDS[name]());
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  if (!muted) playSound("click"); // a blip to confirm it's back on
  return muted;
}
