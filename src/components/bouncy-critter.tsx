import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Critter, type CritterMood } from '@/components/critter';
import type { CritterSpec } from '@/data/creatures';

const sine = Easing.inOut(Easing.sin);
const out = Easing.out(Easing.cubic);
const into = Easing.in(Easing.cubic);

type Pose = {
  y: SharedValue<number>;
  rot: SharedValue<number>;
  sx: SharedValue<number>;
  sy: SharedValue<number>;
  nod: SharedValue<number>;
};

type Gesture = { mood?: CritterMood; ms: number; run: (p: Pose, size: number) => void };

/** Little things a critter does on its own. Each returns to the neutral pose when it ends. */
const GESTURES: Record<string, Gesture> = {
  jump: {
    mood: 'happy',
    ms: 1000,
    run: (p, size) => {
      p.sy.set(withSequence(withTiming(0.88, { duration: 130 }), withTiming(1.08, { duration: 160 }), withTiming(1, { duration: 300 })));
      p.y.set(
        withSequence(
          withDelay(120, withTiming(-size * 0.16, { duration: 220, easing: out })),
          withTiming(0, { duration: 240, easing: into }),
          withTiming(-size * 0.05, { duration: 130, easing: out }),
          withTiming(0, { duration: 160, easing: into }),
        ),
      );
    },
  },
  dance: {
    mood: 'happy',
    ms: 1300,
    run: (p) => {
      p.rot.set(
        withSequence(
          withTiming(-9, { duration: 150, easing: sine }),
          withRepeat(withSequence(withTiming(9, { duration: 220, easing: sine }), withTiming(-9, { duration: 220, easing: sine })), 2),
          withTiming(0, { duration: 180, easing: sine }),
        ),
      );
    },
  },
  tilt: {
    ms: 1600,
    run: (p) => {
      p.rot.set(withSequence(withTiming(12, { duration: 260, easing: out }), withDelay(900, withTiming(0, { duration: 300, easing: sine }))));
    },
  },
  twirl: {
    mood: 'happy',
    ms: 800,
    run: (p) => {
      // A quick turn on the spot: flip through the side view and back.
      p.sx.set(
        withSequence(
          withTiming(-1, { duration: 260, easing: sine }),
          withTiming(1, { duration: 260, easing: sine }),
        ),
      );
    },
  },
  squish: {
    ms: 900,
    run: (p) => {
      p.sy.set(
        withSequence(
          withTiming(0.82, { duration: 200, easing: out }),
          withTiming(1.1, { duration: 220, easing: out }),
          withTiming(1, { duration: 280, easing: sine }),
        ),
      );
    },
  },
  nod: {
    ms: 1000,
    run: (p) => {
      p.nod.set(
        withSequence(
          withTiming(1, { duration: 170, easing: sine }),
          withTiming(0, { duration: 170, easing: sine }),
          withTiming(1, { duration: 170, easing: sine }),
          withTiming(0, { duration: 200, easing: sine }),
        ),
      );
    },
  },
  wink: { mood: 'wink', ms: 900, run: (p) => p.rot.set(withSequence(withTiming(-6, { duration: 200 }), withDelay(450, withTiming(0, { duration: 250 })))) },
  nap: {
    mood: 'sleep',
    ms: 2400,
    run: (p) => {
      p.rot.set(withSequence(withTiming(7, { duration: 600, easing: sine }), withDelay(1300, withTiming(0, { duration: 400, easing: sine }))));
      p.sy.set(withSequence(withTiming(0.95, { duration: 600, easing: sine }), withDelay(1300, withTiming(1, { duration: 400, easing: sine }))));
    },
  },
};

const IDLE_GESTURES = ['dance', 'tilt', 'twirl', 'squish', 'nod', 'wink', 'nap', 'jump', 'tilt', 'wink'];
const CHEER_GESTURES = ['jump', 'dance', 'twirl'];

/**
 * A living critter. Its layers move on their own rhythms (breathing body, wiggling ears and
 * tail, a face that glances and blinks), and every few seconds it does something of its own:
 * a dance, a head tilt, a twirl, a wink, a nap. It celebrates whenever `cheer` changes.
 */
export function BouncyCritter({ spec, size, cheer = 0 }: { spec: CritterSpec; size: number; cheer?: number }) {
  const breathe = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const look = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const nod = useSharedValue(0);
  const stepL = useSharedValue(0);
  const stepR = useSharedValue(0);
  const [blinking, setBlinking] = useState(false);
  const [acting, setActing] = useState<CritterMood | null>(null);
  const busyUntil = useRef(0);
  const mood: CritterMood = acting ?? (blinking ? 'blink' : 'idle');

  const perform = (name: string) => {
    const g = GESTURES[name];
    busyUntil.current = Date.now() + g.ms;
    g.run({ y, rot, sx, sy, nod }, size);
    if (g.mood) {
      setActing(g.mood);
      setTimeout(() => setActing(null), g.ms);
    }
  };
  // Keep the latest `perform` reachable from long-lived timers without re-creating them.
  const performRef = useRef(perform);
  useEffect(() => {
    performRef.current = perform;
  });

  useEffect(() => {
    breathe.set(withRepeat(withTiming(1, { duration: 1700, easing: sine }), -1, true));
    wiggle.set(withRepeat(withTiming(1, { duration: 1100, easing: sine }), -1, true));
    // Glance right, back, left, back, with pauses in between.
    look.set(
      withRepeat(
        withSequence(
          withDelay(1800, withTiming(1, { duration: 320, easing: sine })),
          withDelay(900, withTiming(0, { duration: 320, easing: sine })),
          withDelay(1500, withTiming(-1, { duration: 320, easing: sine })),
          withDelay(900, withTiming(0, { duration: 320, easing: sine })),
        ),
        -1,
      ),
    );
    // A little shuffle: left foot taps, then the right, then a rest.
    const tap = (delay: number) =>
      withRepeat(
        withSequence(
          withDelay(delay, withTiming(1, { duration: 180, easing: out })),
          withTiming(0, { duration: 200, easing: into }),
          withDelay(2600 - delay, withTiming(0, { duration: 0 })),
        ),
        -1,
      );
    stepL.set(tap(900));
    stepR.set(tap(1300));
  }, [breathe, wiggle, look, stepL, stepR]);

  // Blink and act at irregular intervals so a group of critters never moves in sync.
  useEffect(() => {
    let blinkOpen: ReturnType<typeof setTimeout>;
    let blinkNext: ReturnType<typeof setTimeout>;
    let actNext: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      blinkNext = setTimeout(
        () => {
          setBlinking(true);
          blinkOpen = setTimeout(() => setBlinking(false), 140);
          scheduleBlink();
        },
        2400 + Math.random() * 2600,
      );
    };
    const scheduleAct = () => {
      actNext = setTimeout(
        () => {
          if (Date.now() > busyUntil.current) {
            performRef.current(IDLE_GESTURES[Math.floor(Math.random() * IDLE_GESTURES.length)]);
          }
          scheduleAct();
        },
        3200 + Math.random() * 3800,
      );
    };
    scheduleBlink();
    scheduleAct();
    return () => {
      clearTimeout(blinkOpen);
      clearTimeout(blinkNext);
      clearTimeout(actNext);
    };
  }, []);

  useEffect(() => {
    if (cheer === 0) return;
    const t = setTimeout(() => performRef.current(CHEER_GESTURES[cheer % CHEER_GESTURES.length]), 0);
    return () => clearTimeout(t);
  }, [cheer]);

  const poseStyle = useAnimatedStyle(() => ({
    transformOrigin: 'bottom',
    transform: [{ translateY: y.get() }, { rotate: `${rot.get()}deg` }, { scaleX: sx.get() }, { scaleY: sy.get() }],
  }));
  const bodyStyle = useAnimatedStyle(() => {
    const t = breathe.get();
    return {
      transformOrigin: 'bottom',
      transform: [{ scaleX: 1 + 0.025 * (1 - t) }, { scaleY: 1 - 0.03 * (1 - t) }],
    };
  });
  const backStyle = useAnimatedStyle(() => {
    const t = breathe.get();
    return {
      transformOrigin: 'bottom',
      transform: [
        { translateY: size * 0.03 * (1 - t) },
        { rotate: `${(wiggle.get() - 0.5) * 7}deg` },
        { scaleY: 1 + 0.03 * wiggle.get() },
      ],
    };
  });
  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: size * 0.022 * look.get() },
      { translateY: size * 0.028 * (1 - breathe.get()) + size * 0.04 * nod.get() },
    ],
  }));

  // Feet follow jumps, and each lifts and tips outward on its own beat.
  const footLStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() - size * 0.045 * stepL.get() }, { translateX: -size * 0.012 * stepL.get() }, { rotate: `${-7 * stepL.get()}deg` }],
  }));
  const footRStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() - size * 0.045 * stepR.get() }, { translateX: size * 0.012 * stepR.get() }, { rotate: `${7 * stepR.get()}deg` }],
  }));

  const box = { width: size, height: size };
  return (
    <View style={box}>
      <View style={styles.layer}>
        <Critter spec={spec} size={size} part="ground" />
      </View>
      <Animated.View style={[styles.layer, box, footLStyle]}>
        <Critter spec={spec} size={size} part="footL" />
      </Animated.View>
      <Animated.View style={[styles.layer, box, footRStyle]}>
        <Critter spec={spec} size={size} part="footR" />
      </Animated.View>
      <Animated.View style={[styles.layer, box, poseStyle]}>
        <Animated.View style={[styles.layer, box, backStyle]}>
          <Critter spec={spec} size={size} part="back" />
        </Animated.View>
        <Animated.View style={[styles.layer, box, bodyStyle]}>
          <Critter spec={spec} size={size} part="body" />
        </Animated.View>
        <Animated.View style={[styles.layer, faceStyle]}>
          <Critter spec={spec} size={size} part="face" mood={mood} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
