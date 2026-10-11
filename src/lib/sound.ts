import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { getState } from '@/store/store';

const SOURCES = {
  tap: require('@/assets/sounds/tap.wav'),
  check: require('@/assets/sounds/check.wav'),
  uncheck: require('@/assets/sounds/uncheck.wav'),
  perfect: require('@/assets/sounds/perfect.wav'),
  coin: require('@/assets/sounds/coin.wav'),
  pop: require('@/assets/sounds/pop.wav'),
  whoosh: require('@/assets/sounds/whoosh.wav'),
  reveal: require('@/assets/sounds/reveal.wav'),
  rare: require('@/assets/sounds/rare.wav'),
  streak: require('@/assets/sounds/streak.wav'),
  levelup: require('@/assets/sounds/levelup.wav'),
  chirp: require('@/assets/sounds/chirp.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const VOLUME: Partial<Record<SoundName, number>> = { tap: 0.35, whoosh: 0.6, chirp: 0.5 };

const players = new Map<SoundName, AudioPlayer>();
let configured = false;

/**
 * Plays a short UI sound effect. Effects respect the silent switch and mix with
 * whatever the user is already listening to. Failures are swallowed: sound is a nicety.
 */
export function playSound(name: SoundName) {
  if (!getState().settings.sounds) return;
  try {
    if (!configured) {
      configured = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOURCES[name], { keepAudioSessionActive: true });
      player.volume = VOLUME[name] ?? 0.8;
      players.set(name, player);
    }
    const p = player;
    p.seekTo(0)
      .then(() => p.play())
      .catch(() => {});
  } catch {
    // Audio unavailable (e.g. unsupported environment): stay silent.
  }
}
