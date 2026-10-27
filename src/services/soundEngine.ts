import { AlertSoundId, SoundPreset } from '../types/prayer';

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'adhan_makkah',
    name: 'Original Makkah Adhan (Masjid al-Haram)',
    category: 'adhan',
    description: 'Authentic Grand Mosque recording by legendary Muezzin Sheikh Ali Ibn Ahmad Mulla',
  },
  {
    id: 'adhan_madinah',
    name: 'Original Madinah Adhan (Prophet’s Mosque)',
    category: 'adhan',
    description: 'Authentic Al-Masjid an-Nabawi call to prayer with serene acoustic cadence',
  },
  {
    id: 'adhan_fajr_melody',
    name: 'Original Fajr Dawn Adhan (Makkah)',
    category: 'adhan',
    description: 'Authentic dawn call with "Assalatu khayrun minan-nawm" (Prayer is better than sleep)',
  },
  {
    id: 'adhan_alaqsa',
    name: 'Original Al-Aqsa Adhan (Jerusalem)',
    category: 'adhan',
    description: 'Historic recording from the sacred Al-Aqsa Mosque compound',
  },
  {
    id: 'adhan_mishary',
    name: 'Original Adhan - Mishary Rashid Alafasy',
    category: 'adhan',
    description: 'Renowned emotional call to prayer by Sheikh Mishary Rashid Alafasy',
  },
  {
    id: 'adhan_abdulbasit',
    name: 'Original Adhan - Abdul Basit Abdul Samad',
    category: 'adhan',
    description: 'Legendary golden-age recitation and majestic maqam delivery',
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

// Map sound IDs to real original authentic MP3 recordings stored in /audio/
const AUTHENTIC_ADHAN_MAP: Record<string, string> = {
  adhan_makkah: '/audio/adhan_makkah.mp3',
  adhan_madinah: '/audio/adhan_madinah.mp3',
  adhan_fajr_melody: '/audio/adhan_fajr.mp3',
  adhan_alaqsa: '/audio/adhan_alaqsa.mp3',
  adhan_mishary: '/audio/adhan_mishary.mp3',
  adhan_abdulbasit: '/audio/adhan_abdulbasit.mp3',
};

let currentAudioEl: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let activeNodes: { stop: () => void }[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopAllSounds() {
  // Stop HTML5 Audio if playing
  if (currentAudioEl) {
    try {
      currentAudioEl.pause();
      currentAudioEl.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudioEl = null;
  }

  // Stop any active WebAudio nodes
  activeNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // ignore
    }
  });
  activeNodes = [];
}

/**
 * Play authentic original Adhan MP3 or synthesized ambient alert chime
 */
export function playAlertSound(soundId: AlertSoundId, volume: number = 0.8): { stop: () => void } {
  stopAllSounds();

  if (soundId === 'mute' || volume <= 0) {
    return { stop: () => {} };
  }

  const safeVolume = Math.max(0, Math.min(1, volume));

  // 1. If it's an authentic original Adhan recording, play real MP3
  if (AUTHENTIC_ADHAN_MAP[soundId]) {
    const audioUrl = AUTHENTIC_ADHAN_MAP[soundId];
    const audio = new Audio(audioUrl);
    audio.volume = safeVolume;
    currentAudioEl = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Direct HTML5 audio playback error:', err);
        // Fall back to WebAudio synthesis if blocked by autoplay policy
        playSynthesizedFallback(soundId, safeVolume);
      });
    }

    const handle = {
      stop: () => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // ignore
        }
        if (currentAudioEl === audio) {
          currentAudioEl = null;
        }
      },
    };

    activeNodes.push(handle);
    return handle;
  }

  // 2. Play ambient chime / warning gong via WebAudio API
  return playSynthesizedFallback(soundId, safeVolume);
}

function playSynthesizedFallback(soundId: AlertSoundId, volume: number): { stop: () => void } {
  const ctx = getAudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
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
        nodesToStop.forEach((n) => {
          try {
            if ('stop' in n && typeof (n as AudioScheduledSourceNode).stop === 'function') {
              (n as AudioScheduledSourceNode).stop();
            }
          } catch {
            // ignore
          }
        });
      }, 150);
    },
  };

  activeNodes.push(handle);
  const now = ctx.currentTime;

  switch (soundId) {
    case 'soft_dawn_chime': {
      const chimeFreqs = [659.25, 830.61, 987.77, 1318.51];
      chimeFreqs.forEach((freq, idx) => {
        playChime(ctx, masterGain, freq, now + idx * 0.35, 3.0, nodesToStop);
      });
      break;
    }

    case 'oud_melody': {
      const notes = [
        { freq: 220.0, start: 0.0 },
        { freq: 246.94, start: 0.25 },
        { freq: 261.63, start: 0.5 },
        { freq: 329.63, start: 0.8 },
        { freq: 392.0, start: 1.15 },
        { freq: 440.0, start: 1.5 },
        { freq: 329.63, start: 2.1 },
        { freq: 220.0, start: 2.8 },
      ];
      notes.forEach(({ freq, start }) => {
        playOudPluck(ctx, masterGain, freq, now + start, nodesToStop);
      });
      break;
    }

    case 'resonant_bowl': {
      const bowlFreqs = [432, 864, 1296, 1728];
      bowlFreqs.forEach((freq, i) => {
        const gain = 0.5 / (i + 1);
        playChime(ctx, masterGain, freq, now, 6.0, nodesToStop, gain);
      });
      break;
    }

    case 'gentle_bell': {
      playTubularBell(ctx, masterGain, 523.25, now, 4.0, nodesToStop);
      playTubularBell(ctx, masterGain, 659.25, now + 0.6, 4.0, nodesToStop);
      playTubularBell(ctx, masterGain, 783.99, now + 1.2, 5.0, nodesToStop);
      break;
    }

    case 'subtle_chime': {
      playChime(ctx, masterGain, 880, now, 1.2, nodesToStop, 0.4);
      playChime(ctx, masterGain, 1174.66, now + 0.18, 1.6, nodesToStop, 0.35);
      break;
    }

    case 'warning_gong': {
      playGong(ctx, masterGain, 196.0, now, 4.5, nodesToStop);
      playChime(ctx, masterGain, 392.0, now + 0.05, 3.0, nodesToStop, 0.25);
      break;
    }

    case 'warning_pulse': {
      playWarningPulse(ctx, masterGain, 440, now, 0.3, nodesToStop);
      playWarningPulse(ctx, masterGain, 554.37, now + 0.4, 0.5, nodesToStop);
      break;
    }

    case 'warning_woodblock': {
      playWoodblock(ctx, masterGain, 800, now, nodesToStop);
      playWoodblock(ctx, masterGain, 950, now + 0.18, nodesToStop);
      break;
    }

    default: {
      // Generic pleasant alert chime
      playChime(ctx, masterGain, 587.33, now, 2.5, nodesToStop, 0.4);
      playChime(ctx, masterGain, 880.0, now + 0.2, 3.0, nodesToStop, 0.35);
      break;
    }
  }

  return handle;
}

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
