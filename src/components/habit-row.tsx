import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Glyph, Icon } from '@/components/ui/icon';
import { HabitColors, Radius, Squircle } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { alpha, tint } from '@/lib/color';
import { type Habit, XP_PER_HABIT } from '@/store/game';

type Props = {
  habit: Pick<Habit, 'title' | 'icon' | 'color'>;
  done: boolean;
  streak: number;
  onToggle?: () => void;
  onLongPress?: () => void;
};

export function HabitRow({ habit, done, streak, onToggle, onLongPress }: Props) {
  const theme = useTheme();
  const dark = useIsDark();
  const color = HabitColors[habit.color] ?? HabitColors.ember;
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (!done) {
      scale.set(
        withSequence(
          withTiming(1.1, { duration: 120, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 220, easing: Easing.inOut(Easing.cubic) }),
        ),
      );
    }
    onToggle?.();
  };

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={350}
      disabled={!onToggle}
      accessibilityRole="checkbox"
      aria-checked={done}
      accessibilityLabel={habit.title}
      accessibilityHint="Long-press to edit">
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            {
              backgroundColor: done ? alpha(color, dark ? 0.16 : 0.1) : theme.surface,
              borderColor: done ? alpha(color, 0.5) : theme.border,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}>
          <View style={[styles.emojiTile, { backgroundColor: alpha(color, dark ? 0.24 : 0.16) }]}>
            <Glyph name={habit.icon} size={26} color={color} />
          </View>
          <View style={styles.body}>
            <AppText variant="bodyStrong" numberOfLines={2}>
              {habit.title || 'New habit'}
            </AppText>
            <View style={styles.meta}>
              {streak > 0 ? (
                <View style={styles.streak}>
                  <Icon ios="flame.fill" md="local_fire_department" size={14} color={theme.flame} />
                  <AppText variant="captionStrong" color="flame">
                    {streak} day{streak === 1 ? '' : 's'}
                  </AppText>
                </View>
              ) : (
                <AppText variant="caption" color="textFaint">
                  No streak yet
                </AppText>
              )}
              <AppText variant="caption" color="textFaint">
                ·
              </AppText>
              <AppText variant="captionStrong" color={done ? color : 'textMuted'}>
                +{XP_PER_HABIT} XP
              </AppText>
            </View>
          </View>
          <View>
            <Animated.View
              style={[
                styles.check,
                done
                  ? { backgroundColor: color, borderColor: tint(color, -0.15) }
                  : { borderColor: theme.borderStrong, backgroundColor: theme.surface },
                checkStyle,
              ]}>
              {done && <Icon ios="checkmark" md="check" size={20} color="#FFFFFF" weight="heavy" />}
            </Animated.View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: Radius.lg,
    ...Squircle,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  emojiTile: {
    width: 50,
    height: 50,
    borderRadius: 16,
    ...Squircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
