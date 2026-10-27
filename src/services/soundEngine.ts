import { AlertSoundId, SoundPreset } from '../types/prayer';

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'adhan_makkah',
    name: 'Makkah Adhan (Maqam Bayati)',
    category: 'adhan',
    description: 'Iconic Grand Mosque melody with rich harmonics and contemplative cadence',
  },
  {
    id: 'adhan_madinah',
    name: 'Madinah Adhan (Maqam Rast)',
    category: 'adhan',
    description: 'Warm, serene Prophet’s Mosque acoustic melody with gentle resonance',
  },
  {
    id: 'adhan_fajr_melody',
    name: 'Fajr Dawn Melodic Call',
    category: 'adhan',
    description: 'Special dawn melody incorporating the contemplative Assalatu Khayrum Minan-Nawm intervals',
  },
  {
    id: 'adhan_alaqsa',
    name: 'Al-Aqsa Style Tone',
    category: 'adhan',
    description: 'Dignified traditional cadence with deep acoustic projection',
  },
  {
    id: 'soft_dawn_chime',
    name: 'Soft Dawn Crystal Chime',
    category: 'chime',
    description: 'Gentle ascending crystal chimes with pristine morning shimmer',
  },
  {
    id: 'oud_melody',
    name: 'Acoustic Oud Motif',
    category: 'melodic',
    description: 'Traditional string plucks in harmonic minor scale',
  },
  {
    id: 'resonant_bowl',
    name: 'Resonant Acoustic Bowl',
    category: 'chime',
    description: 'Deep 432Hz harmonic singing resonance for calm awareness',
  },
  {
    id: 'gentle_bell',
    name: 'Tubular Sanctuary Bell',
    category: 'chime',
    description: 'Warm dual-harmonic bell with gentle decay',
  },
  {
    id: 'subtle_chime',
    name: 'Subtle Quick Chime',
    category: 'chime',
    description: 'Discreet two-tone chime suitable for offices and quiet places',
  },
  {
    id: 'warning_gong',
    name: 'End-of-Prayer Resonant Gong',
    category: 'warning',
    description: 'Soft cautionary tone reminding that the current prayer window is closing',
  },
  {
    id: 'warning_pulse',
    name: 'End Reminder Dual Pulse',
    category: 'warning',
    description: 'Gentle amber double-tone reminder to complete prayers in time',
  },
  {
    id: 'warning_woodblock',
    name: 'Acoustic Woodblock Tap',
    category: 'warning',
    description: 'Organic percussive tap alert with zero musical disturbance',
  },
  {
    id: 'mute',
    name: 'Silent (No Sound)',
    category: 'silent',
    description: 'Visual notification only without audio alert',
  },
];

let audioCtx: AudioContext | null = null;
let activeNodes: { stop: () => void }[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopAllSounds() {
  activeNodes.forEach(node => {
    try {
      node.stop();
    } catch {
      // Ignore if already stopped
    }
  });
  activeNodes = [];
}

/**
 * Play a synthesized sound with real acoustics
 */
export function playAlertSound(soundId: AlertSoundId, volume: number = 0.8): { stop: () => void } {
  stopAllSounds();

  if (soundId === 'mute' || volume <= 0) {
    return { stop: () => {} };
  }

  const ctx = getAudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  let isPlaying = true;
  const nodesToStop: AudioNode[] = [];

  const handle = {
    stop: () => {
      if (!isPlaying) return;
      isPlaying = false;
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      setTimeout(() => {
        nodesToStop.forEach(n => {
          try {
            if ('stop' in n && typeof (n as AudioScheduledSourceNode).stop === 'function') {
              (n as AudioScheduledSourceNode).stop();
            }
          } catch {
            // ignore
          }
        });
      }, 150);
    }
  };

  activeNodes.push(handle);

  const now = ctx.currentTime;

  switch (soundId) {
    case 'adhan_makkah': {
      // Maqam Bayati: D4, Eb4 (quarter tone approx ~308Hz), F4 (349Hz), G4 (392Hz), A4 (440Hz), Bb4 (466Hz)
      // "Allahu Akbar, Allahu Akbar" cadence with vocal formant filter
      const notes = [
        { freq: 293.66, start: 0.0, dur: 0.8 }, // D4 - Al-
        { freq: 392.00, start: 0.8, dur: 1.2 }, // G4 - lahu
        { freq: 440.00, start: 2.1, dur: 1.4 }, // A4 - Ak-
        { freq: 392.00, start: 3.6, dur: 1.8 }, // G4 - bar
        { freq: 349.23, start: 5.6, dur: 0.9 }, // F4 - Al-
        { freq: 392.00, start: 6.6, dur: 1.3 }, // G4 - lahu
        { freq: 440.00, start: 8.0, dur: 1.5 }, // A4 - Ak-
        { freq: 293.66, start: 9.6, dur: 2.4 }, // D4 - bar (final resolution)
      ];

      notes.forEach(({ freq, start, dur }) => {
        playVocalTone(ctx, masterGain, freq, now + start, dur, nodesToStop);
      });
      break;
    }

    case 'adhan_madinah': {
      // Maqam Rast: C4, D4, E(half-flat ~320Hz), F4, G4, A4
      const notes = [
        { freq: 261.63, start: 0.0, dur: 0.7 }, // C4
        { freq: 329.63, start: 0.8, dur: 1.2 }, // E4
        { freq: 392.00, start: 2.1, dur: 1.5 }, // G4
        { freq: 349.23, start: 3.7, dur: 1.4 }, // F4
        { freq: 261.63, start: 5.2, dur: 2.0 }, // C4
      ];
      notes.forEach(({ freq, start, dur }) => {
        playVocalTone(ctx, masterGain, freq, now + start, dur, nodesToStop, 0.4);
      });
      break;
    }

    case 'adhan_fajr_melody': {
      // Dawn melodic cadence with reflective flute/vocal overtones
      const notes = [
        { freq: 329.63, start: 0.0, dur: 0.9 }, // E4
        { freq: 392.00, start: 1.0, dur: 1.4 }, // G4
        { freq: 493.88, start: 2.5, dur: 1.8 }, // B4
        { freq: 440.00, start: 4.4, dur: 1.2 }, // A4
        { freq: 392.00, start: 5.7, dur: 1.5 }, // G4
        { freq: 329.63, start: 7.3, dur: 2.5 }, // E4
      ];
      notes.forEach(({ freq, start, dur }) => {
        playFluteTone(ctx, masterGain, freq, now + start, dur, nodesToStop);
      });
      break;
    }

    case 'adhan_alaqsa': {
      const notes = [
        { freq: 246.94, start: 0.0, dur: 0.8 }, // B3
        { freq: 329.63, start: 0.9, dur: 1.3 }, // E4
        { freq: 392.00, start: 2.3, dur: 1.7 }, // G4
        { freq: 369.99, start: 4.1, dur: 1.4 }, // F#4
        { freq: 246.94, start: 5.6, dur: 2.2 }, // B3
      ];
      notes.forEach(({ freq, start, dur }) => {
        playVocalTone(ctx, masterGain, freq, now + start, dur, nodesToStop, 0.5);
      });
      break;
    }

    case 'soft_dawn_chime': {
      const chimeFreqs = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      chimeFreqs.forEach((freq, idx) => {
        playChime(ctx, masterGain, freq, now + idx * 0.35, 3.0, nodesToStop);
      });
      break;
    }

    case 'oud_melody': {
      const notes = [
        { freq: 220.00, start: 0.0 }, // A3
        { freq: 246.94, start: 0.25 }, // B3
        { freq: 261.63, start: 0.5 }, // C4
        { freq: 329.63, start: 0.8 }, // E4
        { freq: 392.00, start: 1.15 }, // G4
        { freq: 440.00, start: 1.5 }, // A4
        { freq: 329.63, start: 2.1 }, // E4
        { freq: 220.00, start: 2.8 }, // A3 (long)
      ];
      notes.forEach(({ freq, start }) => {
        playOudPluck(ctx, masterGain, freq, now + start, nodesToStop);
      });
      break;
    }

    case 'resonant_bowl': {
      // 432 Hz fundamental with natural metallic overtones
      const bowlFreqs = [432, 864, 1296, 1728];
      bowlFreqs.forEach((freq, i) => {
        const gain = 0.5 / (i + 1);
        playChime(ctx, masterGain, freq, now, 6.0, nodesToStop, gain);
      });
      break;
    }

    case 'gentle_bell': {
      playTubularBell(ctx, masterGain, 523.25, now, 4.0, nodesToStop); // C5
      playTubularBell(ctx, masterGain, 659.25, now + 0.6, 4.0, nodesToStop); // E5
      playTubularBell(ctx, masterGain, 783.99, now + 1.2, 5.0, nodesToStop); // G5
      break;
    }

    case 'subtle_chime': {
      playChime(ctx, masterGain, 880, now, 1.2, nodesToStop, 0.4);
      playChime(ctx, masterGain, 1174.66, now + 0.18, 1.6, nodesToStop, 0.35);
      break;
    }

    case 'warning_gong': {
      // End of prayer warning: Deep, respectful acoustic gong with amber decay
      playGong(ctx, masterGain, 196.00, now, 4.5, nodesToStop); // G3
      playChime(ctx, masterGain, 392.00, now + 0.05, 3.0, nodesToStop, 0.25);
      break;
    }

    case 'warning_pulse': {
      // Gentle warning double pulse
      playWarningPulse(ctx, masterGain, 440, now, 0.3, nodesToStop);
      playWarningPulse(ctx, masterGain, 554.37, now + 0.4, 0.5, nodesToStop);
      break;
    }

    case 'warning_woodblock': {
      playWoodblock(ctx, masterGain, 800, now, nodesToStop);
      playWoodblock(ctx, masterGain, 950, now + 0.18, nodesToStop);
      break;
    }
  }

  return handle;
}

// Helper: Vocal tone synthesizer with formant filtering (simulates human adhan vocal resonance)
function playVocalTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  nodesList: AudioNode[],
  baseGain = 0.45
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();

  // Vibrato LFO
  vibrato.frequency.setValueAtTime(4.8, startTime);
  vibratoGain.gain.setValueAtTime(2.5, startTime);
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc1.frequency);
  vibratoGain.connect(osc2.frequency);

  osc1.type = 'sawtooth';
  osc2.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, startTime);
  osc2.frequency.setValueAtTime(freq * 1.002, startTime); // slight detune for warmth

  // Vocal formant filters
  const formant1 = ctx.createBiquadFilter();
  formant1.type = 'bandpass';
  formant1.frequency.setValueAtTime(750, startTime); // "Ah" vowel formant
  formant1.Q.setValueAtTime(4.0, startTime);

  const formant2 = ctx.createBiquadFilter();
  formant2.type = 'lowpass';
  formant2.frequency.setValueAtTime(2200, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(baseGain, startTime + 0.25);
  gain.gain.setValueAtTime(baseGain, startTime + duration - 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc1.connect(formant1);
  osc2.connect(formant1);
  formant1.connect(formant2);
  formant2.connect(gain);
  gain.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  vibrato.start(startTime);

  osc1.stop(startTime + duration + 0.1);
  osc2.stop(startTime + duration + 0.1);
  vibrato.stop(startTime + duration + 0.1);

  nodesList.push(osc1, osc2, vibrato);
}

// Helper: Nay / Flute tone synthesizer
function playFluteTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  nodesList: AudioNode[]
) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  // Subtle breath noise
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq, startTime);
  filter.Q.setValueAtTime(3.0, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.35, startTime + 0.3);
  gain.gain.setValueAtTime(0.35, startTime + duration - 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
  nodesList.push(osc);
}

// Helper: Pure bell / crystal chime
function playChime(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  nodesList: AudioNode[],
  peakGain = 0.3
) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  // Overtone
  const overtone = ctx.createOscillator();
  overtone.type = 'sine';
  overtone.frequency.setValueAtTime(freq * 2.76, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(peakGain * 0.3, startTime);
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.4);

  osc.connect(gain);
  overtone.connect(overtoneGain);
  gain.connect(dest);
  overtoneGain.connect(dest);

  osc.start(startTime);
  overtone.start(startTime);
  osc.stop(startTime + duration + 0.1);
  overtone.stop(startTime + duration + 0.1);

  nodesList.push(osc, overtone);
}

// Helper: Oud pluck sound
function playOudPluck(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  nodesList: AudioNode[]
) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startTime);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4, startTime);
  filter.frequency.exponentialRampToValueAtTime(freq, startTime + 0.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.4, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + 1.3);
  nodesList.push(osc);
}

// Helper: Tubular bell
function playTubularBell(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  nodesList: AudioNode[]
) {
  const fundamental = ctx.createOscillator();
  const partial2 = ctx.createOscillator();
  fundamental.type = 'sine';
  partial2.type = 'sine';

  fundamental.frequency.setValueAtTime(freq, startTime);
  partial2.frequency.setValueAtTime(freq * 2.02, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  fundamental.connect(gain);
  partial2.connect(gain);
  gain.connect(dest);

  fundamental.start(startTime);
  partial2.start(startTime);
  fundamental.stop(startTime + duration + 0.1);
  partial2.stop(startTime + duration + 0.1);

  nodesList.push(fundamental, partial2);
}

// Helper: Acoustic gong
function playGong(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  nodesList: AudioNode[]
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'sine';
  osc2.type = 'triangle';

  osc1.frequency.setValueAtTime(freq, startTime);
  osc2.frequency.setValueAtTime(freq * 1.48, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.5, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration + 0.1);
  osc2.stop(startTime + duration + 0.1);

  nodesList.push(osc1, osc2);
}

// Helper: Warning pulse
function playWarningPulse(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  nodesList: AudioNode[]
) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
  nodesList.push(osc);
}

// Helper: Acoustic woodblock
function playWoodblock(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  nodesList: AudioNode[]
) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.4, startTime + 0.06);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.45, startTime + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + 0.1);
  nodesList.push(osc);
}
