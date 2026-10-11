import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

/** A flat gloss stripe that sweeps across a card, like light catching foil. */
export function HoloShimmer({ width, height, delay = 1800 }: { width: number; height: number; delay?: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withDelay(delay, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
  }, [t, delay]);

  const band = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.get(), [0, 1], [-width * 0.9, width * 1.2]) },
      { rotate: '20deg' },
    ],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.clip]}>
      <Animated.View style={[styles.band, { top: -height * 0.3, width: width * 0.16, height: height * 1.6 }, band]} />
      <Animated.View
        style={[styles.band, styles.thin, { top: -height * 0.3, left: width * 0.2, width: width * 0.05, height: height * 1.6 }, band]}
      />
    </View>
  );
}

/** Flat sunburst rays, used behind epic+ art and the pack reveal. */
export function Rays({ size, color, opacity = 0.5, count = 14 }: { size: number; color: string; opacity?: number; count?: number }) {
  const rays = Array.from({ length: count }, (_, i) => {
    const a0 = (i / count) * Math.PI * 2;
    const a1 = a0 + (Math.PI / count) * 0.9;
    const r = 75;
    return `M50 50 L${50 + Math.cos(a0) * r} ${50 + Math.sin(a0) * r} L${50 + Math.cos(a1) * r} ${50 + Math.sin(a1) * r} Z`;
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G fill={color} opacity={opacity}>
        {rays.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}

/** Flat translucent disc used as a halo behind featured art. */
export function Glow({ size, color, opacity = 0.25 }: { size: number; color: string; opacity?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }} />;
}

/** Wraps children in a slow, endless rotation. */
export function Spin({ children, duration = 24000 }: { children: React.ReactNode; duration?: number }) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.set(withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1));
  }, [r, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.get()}deg` }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', pointerEvents: 'none' },
  band: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.38)' },
  thin: { backgroundColor: 'rgba(255,255,255,0.28)' },
});
