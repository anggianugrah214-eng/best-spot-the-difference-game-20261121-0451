// Twin Hunt — all sounds are synthesised with WebAudio; no audio files are shipped.
let audioCtx = null;
let muted = false;

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, startAt, dur, type, vol) {
  try {
    const ac = ctx();
    if (!ac || muted) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ac.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(vol, ac.currentTime + startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startAt + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(ac.currentTime + startAt);
    osc.stop(ac.currentTime + startAt + dur + 0.05);
  } catch {
    // No audio device in this environment — the game plays on silently.
  }
}

export const sfx = {
  find() {
    tone(659.25, 0, 0.16, 'sine', 0.25);
    tone(987.77, 0.09, 0.28, 'sine', 0.25);
  },
  wrong() {
    tone(130.81, 0, 0.22, 'square', 0.12);
    tone(98.0, 0.08, 0.26, 'square', 0.1);
  },
  hint() {
    tone(523.25, 0, 0.14, 'triangle', 0.18);
    tone(783.99, 0.1, 0.2, 'triangle', 0.18);
  },
  levelClear() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.3, 'sine', 0.22));
  },
  gameOver() {
    [392.0, 329.63, 261.63].forEach((f, i) => tone(f, i * 0.16, 0.34, 'triangle', 0.2));
  },
  click() {
    tone(880.0, 0, 0.06, 'sine', 0.12);
  },
};

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  return muted;
}
