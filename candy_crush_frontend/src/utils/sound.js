/* Lightweight WebAudio-based sound effects (no external files). */

let audioCtx = null;

function ensureAudioCtx() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function playTone({ frequency, durationMs, type, volume }) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;

  // Browsers may start AudioContext suspended until a user gesture occurs.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;

  // quick attack/decay envelope to avoid clicks
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec);
}

// PUBLIC_INTERFACE
export function createSoundPlayer({ getMuted, getVolume }) {
  /** Creates a simple sound player that reads mute/volume via callbacks. */
  return {
    // PUBLIC_INTERFACE
    swap() {
      /** Play a short swap sound. */
      if (getMuted()) return;
      playTone({ frequency: 320, durationMs: 70, type: "triangle", volume: 0.08 * getVolume() });
    },
    // PUBLIC_INTERFACE
    invalid() {
      /** Play an invalid move sound. */
      if (getMuted()) return;
      playTone({ frequency: 140, durationMs: 120, type: "sawtooth", volume: 0.06 * getVolume() });
    },
    // PUBLIC_INTERFACE
    match() {
      /** Play a match sound. */
      if (getMuted()) return;
      playTone({ frequency: 560, durationMs: 90, type: "square", volume: 0.06 * getVolume() });
      setTimeout(() => {
        if (getMuted()) return;
        playTone({ frequency: 720, durationMs: 80, type: "square", volume: 0.05 * getVolume() });
      }, 65);
    },
    // PUBLIC_INTERFACE
    levelUp() {
      /** Play a level-up sound. */
      if (getMuted()) return;
      playTone({ frequency: 660, durationMs: 120, type: "triangle", volume: 0.07 * getVolume() });
      setTimeout(() => {
        if (getMuted()) return;
        playTone({ frequency: 880, durationMs: 140, type: "triangle", volume: 0.07 * getVolume() });
      }, 120);
    }
  };
}
