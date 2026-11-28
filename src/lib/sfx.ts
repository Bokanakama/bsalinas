import curseVoice from "@/assets/esquecidos-despertar.asset.json";
let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
function tone(freq: number, dur: number, type: OscillatorType = "square", delay = 0, vol = 0.08) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = a.currentTime + delay;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur);
}
export const sfx = {
  unlock: () => ac(),
  blackout: () => { tone(55, 1.8, "sine", 0, 0.09); tone(82, 1.2, "triangle", 0.3, 0.04); tone(392, 2, "sine", 0.6, 0.03); },
  dice: () => { for (let i = 0; i < 8; i++) tone(200 + Math.random() * 400, 0.05, "square", i * 0.07, 0.05); },
  step: () => tone(660, 0.06, "triangle"),
  coin: () => { tone(988, 0.1, "square", 0); tone(1319, 0.25, "square", 0.08); },
  bad: () => { tone(220, 0.2, "sawtooth", 0); tone(160, 0.35, "sawtooth", 0.15); },
  pix: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, "triangle", i * 0.08, 0.1)); },
  trainWhistle: () => { tone(740, 0.45, "triangle", 0, 0.07); tone(880, 0.45, "triangle", 0, 0.05); tone(740, 0.6, "triangle", 0.5, 0.07); tone(880, 0.6, "triangle", 0.5, 0.05); },
  coffeeCup: () => { tone(2093, 0.08, "sine", 0, 0.06); tone(2637, 0.12, "sine", 0.09, 0.05); },
  scratch: () => tone(120 + Math.random() * 180, 0.04, "sawtooth", 0, 0.025),
  roar: () => { tone(90, 0.5, "sawtooth", 0, 0.12); tone(70, 0.7, "sawtooth", 0.1, 0.12); tone(140, 0.4, "square", 0.05, 0.05); },
  alarm: () => { for (let i = 0; i < 4; i++) { tone(880, 0.18, "square", i * 0.36, 0.07); tone(660, 0.18, "square", i * 0.36 + 0.18, 0.07); } },
  pop: () => tone(1200, 0.06, "sine", 0, 0.05),
  turn: () => { tone(784, 0.1, "triangle"); tone(1047, 0.15, "triangle", 0.1); },
};

// Background "chorinho" loop: a cheerful bass + melody pattern played with WebAudio.
const MELODY = [659, 784, 880, 784, 659, 587, 523, 587, 659, 0, 784, 659, 587, 523, 494, 523];
const BASS = [131, 0, 196, 0, 147, 0, 196, 0, 131, 0, 196, 0, 98, 0, 196, 0];
let timer: ReturnType<typeof setInterval> | null = null;
export const music = {
  playing: () => timer !== null,
  start() {
    if (timer || !ac()) return;
    let i = 0;
    timer = setInterval(() => {
      const k = i % MELODY.length;
      if (MELODY[k]) tone(MELODY[k]!, 0.16, "triangle", 0, 0.025);
      if (BASS[k]) tone(BASS[k]!, 0.22, "sine", 0, 0.05);
      i++;
    }, 180);
  },
  stop() { if (timer) clearInterval(timer); timer = null; },
};

// Narração com áudios gravados (funciona em navegadores de TV sem voz do sistema).
export type VoiceClip = "sorte" | "reves" | "dupla1" | "dupla2" | "tres_duplas" | "saia_livre" | "feriado" | "temporal" | "padroeira" | "fim" | "boro_feriado" | "boro_temporal" | "boro_padroeira" | "selva_feriado" | "selva_temporal" | "selva_padroeira" | "leilao" | "esquecidos_despertar";
let current: HTMLAudioElement | null = null;
export const voice = {
  play(clip: VoiceClip) {
    if (typeof window === "undefined") return;
    current?.pause();
    current = new Audio(clip === "esquecidos_despertar" ? curseVoice.url : `/audio/${clip}.mp3`);
    current.volume = 0.8;
    void current.play().catch(() => {});
  },
  stop() { current?.pause(); current = null; },
};
