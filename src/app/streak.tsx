import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BouncyCritter } from '@/components/bouncy-critter';
import { Confetti } from '@/components/celebration';
import { Flame } from '@/components/flame';
import { Twinkle, Wave } from '@/components/flood';
import { Rays, Spin } from '@/components/holo';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Banner, Font } from '@/constants/theme';
import { getCreature } from '@/data/creatures';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import { currentStreak, nextMilestone, STREAK_MILESTONES, weekOf } from '@/store/game';
import { getState, useGameState, useToday } from '@/store/store';

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ORANGE = Banner.orange;
const NUMBER_H = 124;
const FLAME = 160;

/**
 * Choreography, in ms from when the screen opens:
 * a calm white screen, then an orange wave floods up, the flame ignites as it passes,
 * the number punches over, and a white panel curves up from the bottom.
 */
const T = {
  wave: 500,
  ignite: 1000,
  number: 1500,
  label: 1800,
  panel: 2050,
  todayDot: 2700,
};

const ease = Easing.out(Easing.cubic);

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
  color: ['#FFFFFF', '#FFE58A', '#FFD43B'][i % 3],
}));

const EMBERS = [
  { x: 40, size: 8, drift: -22, delay: 0 },
  { x: 150, size: 6, drift: 18, delay: 500 },
  { x: 86, size: 6, drift: -10, delay: 900 },
  { x: 122, size: 9, drift: 12, delay: 1400 },
  { x: 64, size: 5, drift: 14, delay: 1900 },
];

function Ember({ x, size, drift, delay }: { x: number; size: number; drift: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1)));
  }, [t, delay]);
  const style = useAnimatedStyle(() => {
    const v = t.get();
    return {
      opacity: v === 0 ? 0 : interpolate(v, [0, 0.15, 1], [0, 0.9, 0]),
      transform: [{ translateY: -170 * v }, { translateX: drift * v }, { scale: 1 - 0.6 * v }],
    };
  });
  return (
    <Animated.View
      style={[styles.abs, { left: x, bottom: 40, width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFF3B0' }, style]}
    />
  );
}

/** Grey flame that bursts into a bright one, with a shock ring and sparks. */
function IgnitingFlame({ ignite, burst }: { ignite: SharedValue<number>; burst: SharedValue<number> }) {
  const greyStyle = useAnimatedStyle(() => ({ opacity: 1 - ignite.get() }));
  const litStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, ignite.get() * 3),
    transformOrigin: 'bottom',
    transform: [{ scaleY: 0.3 + 0.7 * ignite.get() }, { scaleX: 0.6 + 0.4 * ignite.get() }],
  }));
  const ringStyle = useAnimatedStyle(() => {
    const v = burst.get();
    return { opacity: v === 0 ? 0 : interpolate(v, [0, 0.2, 1], [0, 0.8, 0]), transform: [{ scale: 0.4 + 1.8 * v }] };
  });
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(burst.get(), [0, 0.25, 1], [0.92, 1.1, 1]) }],
  }));

  return (
    <View style={styles.flameStage}>
      <Animated.View style={[styles.ring, ringStyle]} />
      {SPARKS.map((s, i) => (
        <Spark key={i} p={burst} {...s} />
      ))}
      <Animated.View style={popStyle}>
        <Animated.View style={greyStyle}>
          <Flame size={FLAME} lit={false} flicker={false} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, litStyle]}>
          <Flame size={FLAME} tone="bright" face />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Old number drops away, the new one slams in with a punch and turns white. */
function RollingNumber({ from, to, p, warm }: { from: number; to: number; p: SharedValue<number>; warm: SharedValue<number> }) {
  const oldStyle = useAnimatedStyle(() => ({
    opacity: 1 - p.get(),
    color: interpolateColor(warm.get(), [0, 1], ['#AFAFAF', '#FFFFFF']),
    transform: [{ translateY: -NUMBER_H * 0.8 * p.get() }, { scale: 1 - 0.3 * p.get() }],
  }));
  const newStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.get() * 2),
    transform: [
      { translateY: NUMBER_H * 0.6 * (1 - p.get()) },
      { scale: interpolate(p.get(), [0, 0.6, 0.8, 1], [0.6, 1.25, 0.96, 1]) },
    ],
  }));
  return (
    <View style={styles.numberBox}>
      <Animated.Text style={[styles.number, oldStyle]}>{from}</Animated.Text>
      <Animated.Text style={[styles.number, styles.numberAbs, newStyle]}>{to}</Animated.Text>
    </View>
  );
}

function PlusOne({ p }: { p: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const v = p.get();
    return {
      opacity: interpolate(v, [0, 0.6, 0.9, 1], [0, 0, 1, 1]),
      transform: [{ translateY: interpolate(v, [0.6, 1], [16, 0], 'clamp') }, { rotate: '8deg' }],
    };
  });
  return (
    <Animated.View style={[styles.plusOne, style]}>
      <AppText variant="bodyStrong" color={ORANGE.face}>
        +1
      </AppText>
    </Animated.View>
  );
}

function DayDot({ state, delay }: { state: 'done' | 'today' | 'missed' | 'future'; delay: number }) {
  const theme = useTheme();
  const pop = useSharedValue(state === 'today' ? 0 : 1);
  useEffect(() => {
    if (state !== 'today') return;
    pop.set(
      withDelay(
        delay,
        withSequence(
          withTiming(1.2, { duration: 220, easing: ease }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.cubic) }),
        ),
      ),
    );
  }, [pop, state, delay]);
  const fill = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }], opacity: Math.min(1, pop.get()) }));
  const halo = useAnimatedStyle(() => ({
    opacity: state === 'today' ? interpolate(pop.get(), [0, 0.6, 1.2], [0, 0.5, 0]) : 0,
    transform: [{ scale: 1 + pop.get() * 0.7 }],
  }));

  const lit = state === 'done' || state === 'today';
  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotHalo, halo]} />
      <View
        style={[
          styles.dot,
          { borderColor: lit ? ORANGE.face : state === 'missed' ? theme.surfaceMuted : theme.border },
          state === 'missed' && { backgroundColor: theme.surfaceMuted },
        ]}>
        {lit && (
          <Animated.View style={[StyleSheet.absoluteFill, styles.dotFill, fill]}>
            <Icon ios="flame.fill" md="local_fire_department" size={17} color="#FFFFFF" />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

export default function StreakScreen() {
  const { from, preview } = useLocalSearchParams<{ from?: string; preview?: string }>();
  const isPreview = preview === '1';
  const state = useGameState();
  const today = useToday();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [to] = useState(() => {
    const s = getState();
    const streak = currentStreak(s, today);
    // A preview shows what extending today would look like, without touching any data.
    return isPreview ? Math.max(1, s.perfectDays[today] ? streak : streak + 1) : streak;
  });
  const prev = isPreview ? to - 1 : Math.max(0, Math.min(Number(from ?? to - 1) || 0, to - 1));
  const next = nextMilestone(to);
  const milestone = STREAK_MILESTONES.includes(to);
  const goalHit = to === state.streakGoal;

  const ignite = useSharedValue(0);
  const burst = useSharedValue(0);
  const roll = useSharedValue(0);
  const warm = useSharedValue(0);
  const label = useSharedValue(0);
  const panel = useSharedValue(0);

  useEffect(() => {
    warm.set(withDelay(T.wave + 350, withTiming(1, { duration: 500 })));
    ignite.set(withDelay(T.ignite, withTiming(1, { duration: 380, easing: ease })));
    burst.set(withDelay(T.ignite + 60, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })));
    roll.set(withDelay(T.number, withTiming(1, { duration: 480, easing: ease })));
    label.set(withDelay(T.label, withTiming(1, { duration: 380, easing: ease })));
    panel.set(withDelay(T.panel, withTiming(1, { duration: 560, easing: ease })));
    const timers = [
      setTimeout(() => haptic.tap(), T.wave),
      setTimeout(() => {
        haptic.heavy();
        playSound('streak');
      }, T.ignite),
      setTimeout(() => haptic.heavy(), T.number + 280),
      setTimeout(() => haptic.success(), T.todayDot + 100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [ignite, burst, roll, warm, label, panel]);

  const raysStyle = useAnimatedStyle(() => ({ opacity: ignite.get() }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: label.get(),
    transform: [{ translateY: 16 * (1 - label.get()) }],
  }));
  // The stage slides up a little as the panel arrives, so both fit comfortably.
  const stageStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -20 * panel.get() }] }));
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - panel.get()) * 520 }] }));

  const message = milestone
    ? `${to}-day milestone! A Streak Pack was added to your Vault.`
    : goalHit
      ? `You hit your ${state.streakGoal}-day goal. Legendary!`
      : to === 1
        ? 'You started a streak! Finish tomorrow’s habits to keep it alive.'
        : `You’re on fire! Come back tomorrow to make it ${to + 1}.`;

  const onContinue = () => {
    if (isPreview) router.back();
    else if (getState().packs.length > 0) router.replace('/pack');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Wave width={width} height={height} color="#FFB937" delay={T.wave} duration={900} />
      <Wave width={width} height={height} color={ORANGE.face} delay={T.wave + 160} duration={900} />

      <Animated.View style={[styles.stage, { paddingTop: insets.top + 16 }, stageStyle]}>
        <View style={styles.hero}>
          <Animated.View style={[styles.raysWrap, raysStyle]}>
            <Spin duration={26000}>
              <Rays size={560} color="#FFB937" opacity={0.75} count={16} />
            </Spin>
          </Animated.View>
          <Twinkle x={6} y={34} size={20} delay={T.ignite + 300} />
          <Twinkle x={200} y={10} size={26} delay={T.ignite + 600} />
          <Twinkle x={214} y={132} size={15} delay={T.ignite + 900} />
          <Twinkle x={-4} y={140} size={13} delay={T.ignite + 1200} />
          {EMBERS.map((e, i) => (
            <Ember key={i} {...e} delay={T.ignite + 500 + e.delay} />
          ))}
          <IgnitingFlame ignite={ignite} burst={burst} />
        </View>

        <View>
          <RollingNumber from={prev} to={to} p={roll} warm={warm} />
          <PlusOne p={roll} />
        </View>
        <Animated.View style={labelStyle}>
          <AppText variant="title" color="#FFFFFF" style={styles.label}>
            day streak!
          </AppText>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.panel, { paddingBottom: insets.bottom + 18 }, panelStyle]}>
        <View style={styles.weekRow}>
          {weekOf(today).map((d, i) => {
            const s =
              d === today
                ? 'today'
                : d > today || d < state.createdAt
                  ? 'future'
                  : state.perfectDays[d] || state.shieldedDays[d]
                    ? 'done'
                    : 'missed';
            return (
              <View key={d} style={styles.day}>
                <AppText variant="micro" color={d === today ? ORANGE.face : 'textFaint'} style={styles.dayLabel}>
                  {LABELS[i]}
                </AppText>
                <DayDot state={s} delay={T.todayDot} />
              </View>
            );
          })}
        </View>
        <View style={styles.cheer}>
          <BouncyCritter spec={getCreature(state.buddyId).spec} size={60} cheer={1} />
          <View style={[styles.cheerBubble, { backgroundColor: theme.flameSoft }]}>
            <AppText variant="captionStrong" style={styles.cheerText}>
              {message}
            </AppText>
          </View>
        </View>
        {!milestone && (
          <View style={styles.next}>
            <View style={styles.nextHead}>
              <AppText variant="captionStrong" color="textMuted">
                Next Streak Pack
              </AppText>
              <AppText variant="captionStrong" color="flame">
                {to}/{next} days
              </AppText>
            </View>
            <ProgressBar progress={to / next} color={ORANGE.face} track={theme.surfaceMuted} height={12} />
          </View>
        )}
        <ChunkyButton
          title={isPreview ? 'Done' : state.packs.length > 0 ? 'Continue to my pack' : 'Continue'}
          size="lg"
          color={ORANGE.face}
          shade={ORANGE.edge}
          onPress={onContinue}
        />
      </Animated.View>

      {isPreview && (
        <View style={[styles.previewTag, { top: insets.top + 8 }]}>
          <AppText variant="micro" color="textMuted">
            Preview
          </AppText>
        </View>
      )}
      {(milestone || goalHit) && <Confetti count={50} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  abs: { position: 'absolute' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 300 },
  hero: { width: 230, height: 210, alignItems: 'center', justifyContent: 'flex-end' },
  raysWrap: {
    position: 'absolute',
    left: -165,
    top: -160,
    width: 560,
    height: 560,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  flameStage: { width: FLAME, height: FLAME * 1.2, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 10,
    borderColor: '#FFFFFF',
  },
  numberBox: { height: NUMBER_H, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  number: {
    fontFamily: Font.black,
    fontSize: 112,
    lineHeight: NUMBER_H,
    textAlign: 'center',
    minWidth: 200,
    color: '#FFFFFF',
  },
  numberAbs: { position: 'absolute', left: 0, right: 0 },
  plusOne: {
    position: 'absolute',
    right: 4,
    top: 12,
    paddingHorizontal: 11,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  label: { fontSize: 32, lineHeight: 38, marginTop: -8 },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderCurve: 'continuous',
    paddingHorizontal: 22,
    paddingTop: 24,
    gap: 16,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  dayLabel: { letterSpacing: 0 },
  dotWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dotHalo: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: ORANGE.face },
  dot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2.5, overflow: 'hidden' },
  dotFill: { backgroundColor: ORANGE.face, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  cheer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cheerBubble: { flex: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 },
  cheerText: { fontSize: 14, lineHeight: 19 },
  next: { gap: 6 },
  nextHead: { flexDirection: 'row', justifyContent: 'space-between' },
  previewTag: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
