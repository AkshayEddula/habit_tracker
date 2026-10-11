import { type ReactNode, useEffect, useState } from 'react';
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
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

// A chunky flame with a tall main tongue curling right and a small lick on the left.
const OUTER =
  'M50 116 C24 116 10 98 10 76 C10 58 20 46 28 34 C30 44 34 50 40 52 C38 34 46 14 62 4 C60 20 68 30 78 42 C86 52 90 62 90 76 C90 98 76 116 50 116 Z';
const MID =
  'M50 111 C32 111 21 98 21 82 C21 70 28 62 34 54 C37 62 41 66 46 66 C46 54 52 44 60 37 C61 48 67 54 72 62 C76 68 79 75 79 82 C79 98 68 111 50 111 Z';
const CORE =
  'M50 107 C38 107 31 99 31 89 C31 80 38 75 43 67 C46 72 49 74 52 70 C56 77 69 80 69 90 C69 99 62 107 50 107 Z';
const TEAR = 'M10 0 C13 6 20 10 20 17 C20 23 15.5 27 10 27 C4.5 27 0 23 0 17 C0 10 7 6 10 0 Z';

const INK = '#5A2A00';

const TONES = {
  fire: { rim: '#FF5A1F', outer: '#FF9600', mid: '#FFC21A', core: '#FFF0A0', spark: '#FFB020' },
  bright: { rim: '#FFAE00', outer: '#FFD43B', mid: '#FFEFA3', core: '#FFFFFF', spark: '#FFF3B0' },
  off: { rim: '#CFCFCF', outer: '#DCDCDC', mid: '#EAEAEA', core: '#F6F6F6', spark: '#DCDCDC' },
};

function useLoop(duration: number, enabled: boolean, delay = 0) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return;
    v.set(withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)));
  }, [v, duration, enabled, delay]);
  return v;
}

/** One layer of the flame, drawn in its own view so layers can flicker independently. */
function Layer({ size, children }: { size: number; children: ReactNode }) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      {children}
    </Svg>
  );
}

/** A little detached flame that keeps rising beside the main one. */
function Wisp({ size, x, color, delay }: { size: number; x: number; color: string; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }), -1)));
  }, [t, delay]);
  const style = useAnimatedStyle(() => {
    const v = t.get();
    return {
      opacity: interpolate(v, [0, 0.15, 0.7, 1], [0, 1, 0.8, 0]),
      transform: [{ translateY: -size * 0.42 * v }, { scale: 1 - 0.55 * v }],
    };
  });
  const w = size * 0.13;
  return (
    <Animated.View style={[styles.abs, { left: x - w / 2, top: size * 0.5 }, style]}>
      <Svg width={w} height={w * 1.35} viewBox="0 0 20 27">
        <Path d={TEAR} fill={color} />
      </Svg>
    </Animated.View>
  );
}

function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let open: ReturnType<typeof setTimeout>;
    let next: ReturnType<typeof setTimeout>;
    const schedule = () => {
      next = setTimeout(
        () => {
          setClosed(true);
          open = setTimeout(() => setClosed(false), 150);
          schedule();
        },
        2200 + Math.random() * 2200,
      );
    };
    schedule();
    return () => {
      clearTimeout(open);
      clearTimeout(next);
    };
  }, [enabled]);
  return closed;
}

function layerStyle(t: SharedValue<number>, stretch: number, squeeze: number, tilt: number) {
  'worklet';
  const v = t.get();
  return {
    transformOrigin: 'bottom',
    transform: [{ scaleY: 1 + stretch * v }, { scaleX: 1 - squeeze * v }, { rotate: `${(v - 0.5) * tilt}deg` }],
  };
}

/**
 * The streak flame: four layers that flicker out of sync, wisps that drift up beside it,
 * and (with `face`) a blinking character on the glowing core. Grey when `lit` is false.
 */
export function Flame({
  size,
  lit = true,
  flicker = true,
  face = false,
  tone = 'fire',
}: {
  size: number;
  lit?: boolean;
  flicker?: boolean;
  /** Gives the flame a happy little face (used on the big streak moments). */
  face?: boolean;
  /** `bright` is a yellow-white flame for use on an orange background. */
  tone?: 'fire' | 'bright';
}) {
  const c = TONES[lit ? tone : 'off'];
  const alive = lit && flicker;
  const big = size >= 60;

  const a = useLoop(900, alive);
  const b = useLoop(680, alive, 150);
  const d = useLoop(1150, alive, 300);
  const blink = useBlink(alive && face);

  const outerStyle = useAnimatedStyle(() => layerStyle(a, 0.05, 0.02, 3));
  const midStyle = useAnimatedStyle(() => layerStyle(b, 0.09, 0.04, -3));
  const coreStyle = useAnimatedStyle(() => ({
    transformOrigin: 'bottom',
    transform: [{ scale: 1 + 0.04 * d.get() }, { translateY: -size * 0.012 * d.get() }],
  }));

  return (
    <View style={{ width: size, height: size * 1.2 }}>
      {alive && big && (
        <>
          <Wisp size={size} x={size * 0.08} color={c.spark} delay={0} />
          <Wisp size={size} x={size * 0.93} color={c.spark} delay={850} />
        </>
      )}
      <View style={styles.abs}>
        <Layer size={size}>
          <Ellipse cx={50} cy={117} rx={28} ry={3} fill="#000000" opacity={0.08} />
        </Layer>
      </View>
      <Animated.View style={[styles.abs, outerStyle]}>
        <Layer size={size}>
          <Path d={OUTER} fill={c.rim} stroke={c.rim} strokeWidth={5} strokeLinejoin="round" />
          <Path d={OUTER} fill={c.outer} />
          <Path d="M19 70 C19 62 23 56 27 51" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={4.5} strokeLinecap="round" fill="none" />
          <Circle cx={18.5} cy={80} r={2.4} fill="#FFFFFF" opacity={0.55} />
        </Layer>
      </Animated.View>
      <Animated.View style={[styles.abs, midStyle]}>
        <Layer size={size}>
          <Path d={MID} fill={c.mid} />
        </Layer>
      </Animated.View>
      <Animated.View style={[styles.abs, coreStyle]}>
        <Layer size={size}>
          <Path d={CORE} fill={c.core} />
          {face && lit && (
            <>
              {blink ? (
                <>
                  <Path d="M36.5 87 Q41 90.5 45.5 87" stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
                  <Path d="M54.5 87 Q59 90.5 63.5 87" stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  <Ellipse cx={41} cy={87} rx={4.8} ry={6} fill={INK} />
                  <Ellipse cx={59} cy={87} rx={4.8} ry={6} fill={INK} />
                  <Circle cx={39.3} cy={84.6} r={2} fill="#FFFFFF" />
                  <Circle cx={57.3} cy={84.6} r={2} fill="#FFFFFF" />
                  <Circle cx={42.5} cy={89.6} r={0.9} fill="#FFFFFF" />
                  <Circle cx={60.5} cy={89.6} r={0.9} fill="#FFFFFF" />
                </>
              )}
              <Path d="M45.5 95.5 Q50 102 54.5 95.5 Z" fill={INK} />
              <Path d="M48 99 Q50 97.6 52 99 Q50 101 48 99 Z" fill="#FF7A93" />
              <Ellipse cx={33} cy={94.5} rx={4.2} ry={2.5} fill="#FF7A3D" opacity={0.6} />
              <Ellipse cx={67} cy={94.5} rx={4.2} ry={2.5} fill="#FF7A3D" opacity={0.6} />
            </>
          )}
        </Layer>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
});
