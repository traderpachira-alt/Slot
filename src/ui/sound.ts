// Küçük sentezlenmiş ses efektleri (dosya gerektirmez).
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.06, delay = 0, slide = 0) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export type Sfx = 'click' | 'pick' | 'drop' | 'brew' | 'coin' | 'discover' | 'door' | 'fail' | 'step';

export function sfx(name: Sfx) {
  switch (name) {
    case 'click':
      tone(660, 0.05, 'square', 0.04);
      break;
    case 'pick':
      tone(520, 0.06, 'square', 0.05);
      tone(780, 0.08, 'square', 0.05, 0.06);
      break;
    case 'drop':
      tone(300, 0.12, 'sine', 0.1, 0, -120);
      tone(600, 0.06, 'triangle', 0.05, 0.05, 200);
      break;
    case 'brew':
      for (let i = 0; i < 4; i++) tone(220 + i * 60, 0.09, 'triangle', 0.07, i * 0.07, 80);
      break;
    case 'coin':
      tone(988, 0.07, 'square', 0.05);
      tone(1318, 0.16, 'square', 0.05, 0.07);
      break;
    case 'discover':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, i * 0.11));
      break;
    case 'door':
      tone(180, 0.1, 'triangle', 0.08, 0, -60);
      break;
    case 'fail':
      tone(240, 0.18, 'sawtooth', 0.05, 0, -100);
      break;
    case 'step':
      tone(120, 0.03, 'triangle', 0.03);
      break;
  }
}

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}
