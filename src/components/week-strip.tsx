import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Flame } from '@/components/flame';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Surface } from '@/components/ui/surface';
import { useTheme } from '@/hooks/use-theme';
import { type GameState, parseKey, weekOf } from '@/store/game';

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = { state: GameState; today: string; streak: number };

export function WeekStrip({ state, today, streak }: Props) {
  const theme = useTheme();
  const days = weekOf(today);
  const best = state.bestStreak;
  const goal = state.streakGoal;
  const left = Math.max(0, goal - streak);

  const headline =
    streak === 0
      ? 'Start a streak today'
      : streak >= best && streak > 1
        ? `${streak}-day streak · personal best!`
        : `${streak}-day streak`;

  return (
    <Surface style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Flame size={20} lit={!!state.perfectDays[today]} flicker={false} />
          <AppText variant="bodyStrong">{headline}</AppText>
        </View>
        <View style={[styles.shields, { backgroundColor: theme.surfaceMuted }]}>
          <Icon ios="shield.fill" md="shield" size={14} color={theme.shield} />
          <AppText variant="captionStrong" color="textMuted">
            {state.shields}
          </AppText>
        </View>
      </View>
      <View style={styles.goal}>
        <View style={styles.goalText}>
          <AppText variant="captionStrong" color="textMuted">
            Goal: {goal}-day streak
          </AppText>
          <AppText variant="captionStrong" color={left === 0 ? 'success' : 'flame'}>
            {left === 0 ? 'Goal reached!' : `${left} to go`}
          </AppText>
        </View>
        <ProgressBar progress={Math.min(1, streak / goal)} color={theme.flame} track={theme.surfaceMuted} height={8} />
      </View>
      <View style={styles.row}>
        {days.map((day, i) => {
          const perfect = !!state.perfectDays[day];
          const shielded = !!state.shieldedDays[day];
          const isToday = day === today;
          const future = day > today;
          const beforeStart = day < state.createdAt;
          const dayNum = parseKey(day).getDate();

          let circle;
          if (perfect) {
            circle = (
              <Animated.View
                entering={isToday ? ZoomIn.duration(320) : undefined}
                style={[styles.circle, { backgroundColor: theme.flame, borderColor: theme.flame }]}>
                <Icon ios="checkmark" md="check" size={18} color="#FFFFFF" weight="heavy" />
              </Animated.View>
            );
          } else if (shielded) {
            circle = (
              <View style={[styles.circle, { backgroundColor: theme.shield, borderColor: theme.shield }]}>
                <Icon ios="shield.fill" md="shield" size={16} color="#FFFFFF" />
              </View>
            );
          } else if (isToday) {
            circle = (
              <View style={[styles.circle, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}>
                <AppText variant="captionStrong" color="primary">
                  {dayNum}
                </AppText>
              </View>
            );
          } else {
            const missed = !future && !beforeStart;
            circle = (
              <View
                style={[
                  styles.circle,
                  {
                    borderColor: missed ? theme.surfaceMuted : theme.border,
                    backgroundColor: missed ? theme.surfaceMuted : 'transparent',
                  },
                ]}>
                <AppText variant="captionStrong" color={missed ? 'textMuted' : 'textFaint'}>
                  {dayNum}
                </AppText>
              </View>
            );
          }

          return (
            <View key={day} style={styles.day}>
              <AppText variant="micro" color={isToday ? 'primary' : 'textFaint'} style={styles.label}>
                {LABELS[i]}
              </AppText>
              {circle}
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  goal: { gap: 6 },
  goalText: { flexDirection: 'row', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  shields: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6, flex: 1 },
  label: { letterSpacing: 0 },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
