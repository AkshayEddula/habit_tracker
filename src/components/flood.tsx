import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

/**
 * Shared pieces of the app's "big moment" animation language:
 * a color wave floods the screen, the hero bursts, a number punches in, a panel curves up.
 */

const CAP = 70;

/** One layer of the flood: a wavy crest on top of a solid block, rising from below the screen. */
export function Wave({
  width,
  height,
  color,
  delay,
  duration = 900,
}: {
  width: number;
  height: number;
  color: string;
  delay: number;
  duration?: number;
}) {
  const rise = useSharedValue(0);
  const sway = useSharedValue(0);
  useEffect(() => {
    rise.set(withDelay(delay, withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) })));
    sway.set(withDelay(delay, withTiming(1, { duration: duration + 300, easing: Easing.linear })));
  }, [rise, sway, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(rise.get(), [0, 1], [height + 10, -CAP - 10]) }],
  }));
  const crest = useAnimatedStyle(() => ({ transform: [{ translateX: -width * sway.get() }] }));

  const w = width;
  // Two periods of a smooth wave so the crest can slide sideways while it rises.
  const d = `M0 ${CAP / 2} Q${w / 4} ${-CAP / 3} ${w / 2} ${CAP / 2} T${w} ${CAP / 2} T${w * 1.5} ${CAP / 2} T${w * 2} ${CAP / 2} V${CAP + 2} H0 Z`;

  return (
    <Animated.View style={[styles.wave, { height: height + CAP + 40 }, style]}>
      <Animated.View style={[{ width: w * 2, height: CAP }, crest]}>
        <Svg width={w * 2} height={CAP} viewBox={`0 0 ${w * 2} ${CAP}`}>
          <Path d={d} fill={color} />
        </Svg>
      </Animated.View>
      <View style={[styles.waveBody, { backgroundColor: color }]} />
    </Animated.View>
  );
}

function sparkle(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
}

/** A four-point star that fades in after `delay` and keeps twinkling. */
export function Twinkle({ x, y, size, delay, color = '#FFFFFF' }: { x: number; y: number; size: number; delay: number; color?: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true)));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ opacity: t.get(), transform: [{ scale: 0.6 + 0.4 * t.get() }] }));
  return (
    <Animated.View style={[styles.abs, { left: x, top: y }, style]}>
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path d={sparkle(10, 10, 10)} fill={color} />
      </Svg>
    </Animated.View>
  );
}

function Spark({ p, angle, distance, size, color }: { p: SharedValue<number>; angle: number; distance: number; size: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const v = p.get();
    return {
      opacity: v === 0 ? 0 : interpolate(v, [0, 0.15, 1], [0, 1, 0]),
      transform: [
        { translateX: Math.cos(angle) * distance * v },
        { translateY: Math.sin(angle) * distance * v - 30 * v },
        { scale: 1 - 0.5 * v },
      ],
    };
  });
  return (
    <Animated.View
      style={[styles.abs, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  angle: (i / 18) * Math.PI * 2 + (i % 2 ? 0.2 : 0),
  distance: 110 + (i % 3) * 26,
  size: 8 + (i % 3) * 3,
}));

/** Shock ring plus flying sparks, driven by a 0→1 `p`. Center it on the thing that's bursting. */
export function Burst({ p, colors = ['#FFFFFF', '#FFE58A', '#FFD43B'], size = 180 }: { p: SharedValue<number>; colors?: string[]; size?: number }) {
  const ring = useAnimatedStyle(() => {
    const v = p.get();
    return { opacity: v === 0 ? 0 : interpolate(v, [0, 0.2, 1], [0, 0.8, 0]), transform: [{ scale: 0.4 + 1.8 * v }] };
  });
  return (
    <View style={[StyleSheet.absoluteFill, styles.center]}>
      <Animated.View
        style={[styles.abs, { width: size, height: size, borderRadius: size / 2, borderWidth: 10, borderColor: colors[0] }, ring]}
      />
      {SPARKS.map((s, i) => (
        <Spark key={i} p={p} {...s} color={colors[i % colors.length]} />
      ))}
    </View>
  );
}

/** Starts a 0→1 timing after `delay`; the building block for staging a sequence. */
export function useStage(delay: number, duration = 420) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) })));
  }, [v, delay, duration]);
  return v;
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  wave: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  waveBody: { flex: 1, marginTop: -2 },
});
