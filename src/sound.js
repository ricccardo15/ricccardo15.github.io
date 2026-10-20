// Sound effects for the game, all made in code with Web Audio (no audio files, so nothing to license).
// OFF by default; the visitor's choice is remembered in this browser. While off, no AudioContext is created.
//   crack = bat on ball · crowd = home run · cheer = a smaller crowd · clap = high five
const KEY = 'sound';
let ctx = null;
let on = false;
try { on = localStorage.getItem(KEY) === 'on'; } catch { /* storage blocked: stay off */ }

function audio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx ??= new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// White noise through a filter, with a quick attack and a release: the base of every effect here.
function noise(a, { at = 0, length, type, freq, q = 1, gain, attack = 0.005 }) {
  const start = a.currentTime + at;
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * length), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = a.createBufferSource();
  source.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = a.createGain();
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(gain, start + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, start + length);
  source.connect(filter).connect(env).connect(a.destination);
  source.start(start);
  source.stop(start + length);
}

function crowd(a, size) {
  const length = 2.4 * size;
  noise(a, { length, type: 'bandpass', freq: 650, q: 0.6, gain: 0.22 * size, attack: 0.4 * size });
  noise(a, { length: length * 0.8, type: 'bandpass', freq: 1500, q: 0.8, gain: 0.08 * size, attack: 0.3 * size });
}

const EFFECTS = {
  crack(a) {
    noise(a, { length: 0.07, type: 'highpass', freq: 1800, gain: 0.7 });
    const tone = a.createOscillator();
    const env = a.createGain();
    tone.frequency.setValueAtTime(1300, a.currentTime);
    tone.frequency.exponentialRampToValueAtTime(400, a.currentTime + 0.06);
    env.gain.setValueAtTime(0.35, a.currentTime);
    env.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.08);
    tone.connect(env).connect(a.destination);
    tone.start();
    tone.stop(a.currentTime + 0.09);
  },
  crowd: (a) => crowd(a, 1),
  cheer: (a) => crowd(a, 0.5),
  clap(a) {
    noise(a, { length: 0.05, type: 'bandpass', freq: 1200, q: 0.9, gain: 0.6 });
    noise(a, { at: 0.025, length: 0.06, type: 'bandpass', freq: 1000, q: 0.9, gain: 0.4 });
  },
};

export const sound = {
  get on() { return on; },
  // Called from a click on the toggle (a user gesture), so the browser lets the audio start.
  set(value) {
    on = value;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
    if (on) audio();
  },
  // Browsers only start audio after a click or key press: call this from one, before a sound that comes later.
  wake() {
    if (on) audio();
  },
  play(name) {
    if (!on) return;
    const a = audio();
    if (a) EFFECTS[name](a);
  },
};
