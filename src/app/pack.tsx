import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  SlideInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/celebration';
import { CARD_RATIO, CardBack, CreatureCard } from '@/components/creature-card';
import { Wave } from '@/components/flood';
import { Glow, Rays, Spin } from '@/components/holo';
import { PackArt } from '@/components/pack-art';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';
import { getCreature, RARITIES } from '@/data/creatures';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import { cardLevel, PACK_INFO, type PackKind } from '@/store/game';
import { getState, openPack, type PackResult, useGameState } from '@/store/store';

const C = Colors.light;
const BACKDROP = '#FFF8E6';

type Phase = 'sealed' | 'opening' | 'reveal';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function PackScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const remaining = useGameState().packs.length;
  const [kind, setKind] = useState<PackKind | null>(() => getState().packs[0] ?? null);
  const [phase, setPhase] = useState<Phase>('sealed');
  const [result, setResult] = useState<PackResult | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const float = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const packScale = useSharedValue(1);
  const packOpacity = useSharedValue(1);
  const hint = useSharedValue(0);
  const flash = useSharedValue(0);
  const cardIn = useSharedValue(0);
  const flip = useSharedValue(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    float.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
    hint.set(withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [float, hint]);

  useEffect(() => {
    if (phase !== 'sealed') return;
    wiggle.set(
      withRepeat(
        withSequence(
          withDelay(1600, withTiming(-4, { duration: 80 })),
          withTiming(4, { duration: 80 }),
          withTiming(-3, { duration: 80 }),
          withTiming(0, { duration: 80 }),
        ),
        -1,
      ),
    );
  }, [phase, wiggle]);

  const packW = Math.min(width * 0.56, 230, (height - 300) / 1.45);
  const cardW = Math.min(width * 0.68, 300, (height - insets.top - insets.bottom - 390) / CARD_RATIO);

  const open = () => {
    if (phase !== 'sealed' || !kind) return;
    setPhase('opening');
    haptic.heavy();
    playSound('whoosh');
    wiggle.set(
      withSequence(
        withRepeat(withSequence(withTiming(-7, { duration: 55 }), withTiming(7, { duration: 55 })), 5),
        withTiming(0, { duration: 50 }),
      ),
    );
    packScale.set(withSequence(withTiming(1.06, { duration: 520 }), withTiming(1.4, { duration: 170 })));
    later(() => haptic.medium(), 260);
    later(() => {
      haptic.heavy();
      playSound('pop');
      flash.set(withSequence(withTiming(1, { duration: 110 }), withTiming(0, { duration: 520 })));
      packOpacity.set(0);
      const r = openPack();
      setResult(r);
      setPhase('reveal');
      cardIn.set(0);
      flip.set(0);
      cardIn.set(withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
      flip.set(withDelay(600, withTiming(1, { duration: 720, easing: Easing.inOut(Easing.cubic) })));
      later(() => {
        setShowInfo(true);
        const rarity = r ? getCreature(r.creatureId).rarity : 'common';
        playSound(rarity === 'common' ? 'reveal' : 'rare');
        if (rarity === 'epic' || rarity === 'legendary' || r?.isNew) haptic.success();
        else haptic.medium();
      }, 1350);
    }, 720);
  };

  const next = () => {
    const k = getState().packs[0];
    if (!k) {
      close();
      return;
    }
    setKind(k);
    setResult(null);
    setShowInfo(false);
    setPhase('sealed');
    packScale.set(0.85);
    packScale.set(withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    packOpacity.set(1);
    wiggle.set(0);
  };

  const packStyle = useAnimatedStyle(() => ({
    opacity: packOpacity.get(),
    transform: [
      { translateY: -10 * float.get() },
      { rotate: `${wiggle.get()}deg` },
      { scale: packScale.get() },
    ],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * hint.get() }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));
  const cardWrapStyle = useAnimatedStyle(() => ({
    opacity: cardIn.get(),
    transform: [
      { translateY: interpolate(cardIn.get(), [0, 1], [140, 0]) },
      { scale: interpolate(cardIn.get(), [0, 1], [0.4, 1]) },
    ],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.get() < 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.get() * 180}deg` }],
  }));
  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.get() >= 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.get() * 180 - 180}deg` }],
  }));
  const raysStyle = useAnimatedStyle(() => ({ opacity: interpolate(flip.get(), [0.5, 1], [0, 1], 'clamp') }));

  const creature = result ? getCreature(result.creatureId) : null;
  const rarity = creature ? RARITIES[creature.rarity] : null;
  const fancy = creature?.rarity === 'epic' || creature?.rarity === 'legendary';
  // The screen floods with the rarity's color as the card arrives.
  const flood = !rarity || creature?.rarity === 'common' ? ['#D5DADF', '#AEB6BF'] : [rarity.glow, rarity.color];
  const onFlood = phase === 'reveal';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {phase === 'reveal' && creature && (
        <View key={`${creature.id}-${remaining}`} style={[StyleSheet.absoluteFill, styles.noTouch]}>
          <Wave width={width} height={height} color={flood[0]} delay={250} duration={800} />
          <Wave width={width} height={height} color={flood[1]} delay={400} duration={800} />
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <View style={styles.flex}>
          {kind && (
            <>
              <AppText variant="micro" color={onFlood ? 'rgba(255,255,255,0.85)' : 'textMuted'}>
                {showInfo ? 'You caught' : PACK_INFO[kind].subtitle}
              </AppText>
              <AppText variant="heading" color={onFlood ? '#FFFFFF' : 'text'}>
                {showInfo && creature ? creature.name : PACK_INFO[kind].title}
              </AppText>
            </>
          )}
        </View>
        <Pressable onPress={close} style={styles.close} accessibilityLabel="Close" hitSlop={10}>
          <Icon ios="xmark" md="close" size={18} color={C.textMuted} />
        </Pressable>
      </View>

      {!kind ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Icon ios="tray.fill" md="inbox" size={40} color={C.textFaint} />
          </View>
          <AppText variant="title" align="center">
            No packs right now
          </AppText>
          <AppText variant="body" color="textMuted" align="center" style={styles.emptyText}>
            Finish every habit today to earn your next pack.
          </AppText>
          <ChunkyButton title="Back to habits" onPress={close} style={styles.emptyButton} />
        </View>
      ) : phase !== 'reveal' ? (
        <Pressable style={styles.center} onPress={open} accessibilityRole="button" accessibilityLabel="Open pack">
          <View style={[styles.glow, styles.noTouch]}>
            <Glow size={packW * 1.5} color={PACK_INFO[kind].colors[0]} opacity={0.12} />
          </View>
          <Animated.View style={packStyle}>
            <PackArt width={packW} kind={kind} />
          </Animated.View>
          <Animated.View style={[styles.hint, hintStyle]}>
            <AppText variant="heading" color="textMuted">
              {phase === 'opening' ? 'Opening…' : 'Tap to open'}
            </AppText>
          </Animated.View>
        </Pressable>
      ) : (
        creature &&
        rarity && (
          <View style={[styles.center, styles.revealPad]}>
            <Animated.View style={[styles.glow, styles.noTouch, raysStyle]}>
              <Spin duration={fancy ? 14000 : 26000}>
                <Rays size={Math.max(width, height) * 1.1} color="#FFFFFF" opacity={fancy ? 0.22 : 0.14} count={fancy ? 18 : 12} />
              </Spin>
            </Animated.View>
            <Animated.View style={cardWrapStyle}>
              <View style={{ width: cardW, height: cardW * CARD_RATIO }}>
                <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
                  <CardBack width={cardW} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
                  <CreatureCard creature={creature} width={cardW} count={result!.count} />
                </Animated.View>
              </View>
            </Animated.View>

          </View>
        )
      )}

      {phase === 'reveal' && showInfo && rarity && (
        <Animated.View
          entering={SlideInDown.duration(520)}
          style={[styles.panel, { paddingBottom: insets.bottom + 18 }]}>
          <AppText variant="display" color={rarity.color} align="center" style={styles.rarityText}>
            {rarity.label.toUpperCase()}
            {fancy ? '!' : ''}
          </AppText>
          {result!.isNew ? (
            <View style={[styles.pill, { backgroundColor: C.primary }]}>
              <AppText variant="captionStrong" color="#FFFFFF">
                NEW CRITTER · +{result!.xp} XP
              </AppText>
            </View>
          ) : (
            <View style={[styles.pill, { backgroundColor: C.goldSoft }]}>
              <AppText variant="captionStrong" color={C.goldText}>
                Duplicate · +{result!.coins} coins · now LV {cardLevel(result!.count)}
              </AppText>
            </View>
          )}
          <View style={styles.actions}>
            {remaining > 0 ? (
              <>
                <ChunkyButton title={`Open next pack (${remaining})`} size="lg" onPress={next} />
                <ChunkyButton title="Done" variant="outline" onPress={close} />
              </>
            ) : (
              <ChunkyButton title="Awesome!" size="lg" onPress={close} />
            )}
          </View>
        </Animated.View>
      )}

      {showInfo && fancy && <Confetti count={60} />}
      <Animated.View style={[StyleSheet.absoluteFill, styles.flash, styles.noTouch, flashStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKDROP },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, zIndex: 2 },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  glow: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  hint: { marginTop: 36 },
  rarityText: { letterSpacing: 2 },
  pill: { paddingHorizontal: 14, height: 30, borderRadius: 15, justifyContent: 'center' },
  actions: { gap: 10, alignSelf: 'stretch', marginTop: 6 },
  revealPad: { paddingBottom: 270 },
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
    paddingTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  flash: { backgroundColor: '#FFF3C4' },
  noTouch: { pointerEvents: 'none' },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { marginTop: 8, marginBottom: 24 },
  emptyButton: { alignSelf: 'stretch' },
});
