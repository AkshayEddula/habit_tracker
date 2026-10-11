import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BouncyCritter } from '@/components/bouncy-critter';
import { Confetti } from '@/components/celebration';
import { Burst, Twinkle, useStage, Wave } from '@/components/flood';
import { Rays, Spin } from '@/components/holo';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { CoinIcon, Glyph } from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { Font } from '@/constants/theme';
import { getCreature } from '@/data/creatures';
import { haptic } from '@/lib/haptics';
import { playSound, type SoundName } from '@/lib/sound';
import { useGameState } from '@/store/store';

type Kind = 'level' | 'coins';

const LOOK: Record<Kind, { face: string; light: string; edge: string; icon: IconName; sound: SoundName }> = {
  level: { face: '#58CC02', light: '#7AE026', edge: '#58A700', icon: 'levelup', sound: 'levelup' },
  coins: { face: '#FFC800', light: '#FFDB4D', edge: '#E0A800', icon: 'gift', sound: 'perfect' },
};

const T = { wave: 350, burst: 850, number: 1250, label: 1500, panel: 1750 };

/**
 * Full-screen reward moment in the same language as the streak celebration.
 * `kind=level` celebrates a new level; `kind=coins` celebrates a coin reward.
 */
export default function RewardScreen() {
  const params = useLocalSearchParams<{ kind?: string; value?: string; title?: string; message?: string }>();
  const kind: Kind = params.kind === 'level' ? 'level' : 'coins';
  const look = LOOK[kind];
  const state = useGameState();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const burst = useStage(T.burst, 800);
  const hero = useStage(T.burst - 80, 380);
  const number = useStage(T.number, 480);
  const label = useStage(T.label, 380);
  const panel = useStage(T.panel, 560);

  useEffect(() => {
    const timers = [
      setTimeout(() => haptic.tap(), T.wave),
      setTimeout(() => {
        haptic.heavy();
        playSound(look.sound);
      }, T.burst),
      setTimeout(() => haptic.success(), T.number + 280),
    ];
    return () => timers.forEach(clearTimeout);
  }, [look.sound]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, hero.get() * 2),
    transform: [{ scale: interpolate(burst.get(), [0, 0.25, 1], [0.5 + 0.4 * hero.get(), 1.12, 1]) }],
  }));
  const raysStyle = useAnimatedStyle(() => ({ opacity: hero.get() }));
  const numberStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, number.get() * 2),
    transform: [
      { translateY: 60 * (1 - number.get()) },
      { scale: interpolate(number.get(), [0, 0.6, 0.8, 1], [0.6, 1.25, 0.96, 1]) },
    ],
  }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: label.get(), transform: [{ translateY: 16 * (1 - label.get()) }] }));
  const stageStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -20 * panel.get() }] }));
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - panel.get()) * 420 }] }));

  const done = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Wave width={width} height={height} color={look.light} delay={T.wave} />
      <Wave width={width} height={height} color={look.face} delay={T.wave + 160} />

      <Animated.View style={[styles.stage, { paddingTop: insets.top + 16 }, stageStyle]}>
        <View style={styles.hero}>
          <Animated.View style={[styles.raysWrap, raysStyle]}>
            <Spin duration={26000}>
              <Rays size={560} color={look.light} opacity={0.8} count={16} />
            </Spin>
          </Animated.View>
          <Twinkle x={0} y={24} size={20} delay={T.burst + 300} />
          <Twinkle x={196} y={6} size={26} delay={T.burst + 600} />
          <Twinkle x={206} y={130} size={15} delay={T.burst + 900} />
          <Burst p={burst} />
          <Animated.View style={[styles.medal, { borderBottomColor: 'rgba(0,0,0,0.12)' }, heroStyle]}>
            {kind === 'coins' ? <CoinIcon size={84} /> : <Glyph name={look.icon} size={84} color={look.face} />}
          </Animated.View>
        </View>

        <Animated.Text style={[styles.number, numberStyle]}>
          {kind === 'coins' ? `+${params.value ?? ''}` : params.value}
        </Animated.Text>
        <Animated.View style={labelStyle}>
          <AppText variant="title" color="#FFFFFF" align="center" style={styles.label}>
            {params.title ?? (kind === 'level' ? 'New level!' : 'coins')}
          </AppText>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.panel, { paddingBottom: insets.bottom + 18 }, panelStyle]}>
        <View style={styles.cheer}>
          <BouncyCritter spec={getCreature(state.buddyId).spec} size={64} cheer={1} />
          <View style={[styles.bubble, { backgroundColor: `${look.face}22` }]}>
            <AppText variant="captionStrong" style={styles.bubbleText}>
              {params.message ?? 'Amazing work. Keep it going!'}
            </AppText>
          </View>
        </View>
        <ChunkyButton title="Continue" size="lg" color={look.face} shade={look.edge} textColor={kind === 'coins' ? '#5C4100' : '#FFFFFF'} onPress={done} />
      </Animated.View>

      {kind === 'level' && <Confetti count={50} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 190 },
  hero: { width: 230, height: 200, alignItems: 'center', justifyContent: 'center' },
  raysWrap: {
    position: 'absolute',
    left: -165,
    top: -180,
    width: 560,
    height: 560,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  medal: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontFamily: Font.black, fontSize: 96, lineHeight: 108, color: '#FFFFFF', textAlign: 'center', marginTop: 8 },
  label: { fontSize: 30, lineHeight: 36, marginTop: -6 },
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
    gap: 18,
  },
  cheer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bubble: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  bubbleText: { fontSize: 14, lineHeight: 19 },
});
