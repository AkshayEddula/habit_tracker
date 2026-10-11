import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { CoinIcon, Glyph } from '@/components/ui/icon';
import { BottomTabInset, Squircle } from '@/constants/theme';
import { playSound } from '@/lib/sound';
import { onUIEvent, type Toast } from '@/store/store';

const CONFETTI_COLORS = ['#58CC02', '#FFC800', '#FF9600', '#FF4B4B', '#1FB98B', '#FF5C8A', '#8C9A2E'];

function Piece({ index, width, height }: { index: number; width: number; height: number }) {
  const [cfg] = useState(() => ({
    x: Math.random() * width,
    delay: Math.random() * 300,
    duration: 1700 + Math.random() * 1300,
    spin: (Math.random() - 0.5) * 900,
    drift: (Math.random() - 0.5) * 140,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    w: 7 + Math.random() * 6,
    h: 11 + Math.random() * 8,
    round: Math.random() < 0.3,
  }));
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(withDelay(cfg.delay, withTiming(1, { duration: cfg.duration, easing: Easing.out(Easing.quad) })));
  }, [p, cfg]);

  const style = useAnimatedStyle(() => {
    const v = p.get();
    return {
      opacity: v > 0.8 ? (1 - v) / 0.2 : 1,
      transform: [
        { translateX: cfg.x + cfg.drift * v },
        { translateY: -30 + (height + 60) * v },
        { rotate: `${cfg.spin * v}deg` },
        { rotateX: `${cfg.spin * v * 0.6}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: cfg.w,
          height: cfg.round ? cfg.w : cfg.h,
          borderRadius: cfg.round ? cfg.w / 2 : 2,
          backgroundColor: cfg.color,
        },
        style,
      ]}
    />
  );
}

export function Confetti({ count = 44 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={[StyleSheet.absoluteFill, styles.noTouch]}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} index={i} width={width} height={height} />
      ))}
    </View>
  );
}

/** App-wide overlay for toasts (level ups, badges) and confetti bursts. */
export function CelebrationOverlay() {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<Toast[]>([]);
  const [burst, setBurst] = useState<number | null>(null);

  useEffect(
    () =>
      onUIEvent((e) => {
        if (e.type === 'toast') {
          if (e.toast.icon === 'levelup') playSound('levelup');
          const t = e.toast;
          // A tagged nudge shows immediately and replaces the previous one, so rapid check-offs never pile up.
          setQueue((q) => (t.tag ? [t, ...q.filter((x) => x.tag !== t.tag)] : [...q, t]));
        }
        else setBurst(e.id);
      }),
    [],
  );

  const current = queue[0];
  const currentId = current?.id;
  const currentTag = current?.tag;

  useEffect(() => {
    if (currentId === undefined) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), currentTag ? 2200 : 2800);
    return () => clearTimeout(t);
  }, [currentId, currentTag]);

  useEffect(() => {
    if (burst === null) return;
    const t = setTimeout(() => setBurst(null), 3400);
    return () => clearTimeout(t);
  }, [burst]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.passThrough]}>
      {burst !== null && <Confetti key={burst} />}
      {current && (
        <Animated.View
          key={current.id}
          entering={FadeInDown.duration(320)}
          exiting={FadeOutDown.duration(220)}
          style={[styles.toastWrap, { bottom: insets.bottom + BottomTabInset + 14 }]}>
          <Pressable onPress={() => setQueue((q) => q.slice(1))} style={styles.toast}>
            <Animated.View
              entering={ZoomIn.delay(120).duration(280)}
              style={[styles.toastIcon, { backgroundColor: current.color ?? '#58CC02' }]}>
              {current.icon === 'coin' ? <CoinIcon size={26} /> : <Glyph name={current.icon} size={22} color="#FFFFFF" />}
            </Animated.View>
            <View style={styles.toastText}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {current.title}
              </AppText>
              {current.subtitle && (
                <AppText variant="caption" color="textMuted" numberOfLines={2}>
                  {current.subtitle}
                </AppText>
              )}
            </View>
            {current.chips && (
              <View style={styles.chips}>
                {current.chips.map((c, i) => (
                  <Animated.View key={c.text} entering={FadeInDown.delay(200 + i * 110).duration(260)} style={styles.chip}>
                    {c.icon === 'coin' ? <CoinIcon size={14} /> : <Glyph name={c.icon} size={13} color="#58CC02" />}
                    <AppText variant="captionStrong">{c.text}</AppText>
                  </Animated.View>
                ))}
              </View>
            )}
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', left: 0, top: 0 },
  noTouch: { pointerEvents: 'none' },
  passThrough: { pointerEvents: 'box-none' },
  toastWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', pointerEvents: 'box-none' },
  toast: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...Squircle,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#E5E5E5',
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.16)',
  },
  toastIcon: { width: 42, height: 42, borderRadius: 14, ...Squircle, alignItems: 'center', justifyContent: 'center' },
  toastText: { flex: 1 },
  chips: { gap: 4, alignItems: 'flex-end' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F4F4F4',
  },
});
