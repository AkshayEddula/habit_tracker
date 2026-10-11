import { router, useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BuddyHero } from '@/components/buddy-hero';
import { DailyGift } from '@/components/daily-gift';
import { Flame } from '@/components/flame';
import { HabitRow } from '@/components/habit-row';
import { AppText } from '@/components/ui/app-text';
import { CoinIcon, Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenScroll } from '@/components/ui/screen-scroll';
import { StatChip } from '@/components/ui/stat-chip';
import { Surface } from '@/components/ui/surface';
import { HabitColors } from '@/constants/theme';
import { getCreature } from '@/data/creatures';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import { COINS_PER_HABIT, currentStreak, giftStatus, habitStreak, levelInfo, parseKey, XP_PER_HABIT } from '@/store/game';
import { dismissNotice, showToast, takePendingLevel, toggleHabit, useGameState, useToday } from '@/store/store';
import { WeekStrip } from '@/components/week-strip';

function celebrateLevel() {
  const level = takePendingLevel();
  if (!level) return;
  setTimeout(
    () =>
      router.push({
        pathname: '/reward',
        params: { kind: 'level', value: String(level), title: 'Level up!', message: `You reached level ${level}. Every habit makes you stronger!` },
      }),
    500,
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const state = useGameState();
  const today = useToday();
  const theme = useTheme();
  const [cheer, setCheer] = useState(0);

  const buddy = getCreature(state.buddyId);
  const doneIds = state.completions[today] ?? [];
  const total = state.habits.length;
  const done = state.habits.filter((h) => doneIds.includes(h.id)).length;
  const streak = currentStreak(state, today);
  const level = levelInfo(state.xp);
  const claimedToday = !!state.perfectDays[today];
  const dateLabel = parseKey(today).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Level-ups get the full-screen treatment once Today is in front (after a streak or pack screen closes).
  useFocusEffect(celebrateLevel);

  const onToggle = (id: string) => {
    const result = toggleHabit(id);
    if (!result.done) {
      haptic.select();
      playSound('uncheck');
      return;
    }
    setCheer((c) => c + 1);
    if (result.perfect) {
      haptic.success();
      playSound('perfect');
      // Duolingo-style streak celebration, which then leads into today's pack.
      setTimeout(() => router.push({ pathname: '/streak', params: { from: String(streak) } }), 450);
    } else {
      haptic.medium();
      playSound('check');
      const left = total - done - 1;
      showToast({
        tag: 'habit',
        icon: 'check',
        color: HabitColors[state.habits.find((h) => h.id === id)?.color ?? 'green'],
        title: left === 1 ? 'So close!' : 'Nice work!',
        subtitle: `${left} more to unlock today’s pack`,
        chips: [
          { icon: 'bolt', text: `+${XP_PER_HABIT} XP` },
          { icon: 'coin', text: `+${COINS_PER_HABIT}` },
        ],
      });
      celebrateLevel();
    }
  };

  const openPack = () => router.push('/pack');
  const addHabit = () => router.push('/habit');

  return (
    <ScreenScroll>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <AppText variant="micro" color="textMuted">
            {dateLabel}
          </AppText>
          <View style={styles.chips}>
            <StatChip
              label={`${streak} day streak`}
              icon={<Flame size={18} lit={claimedToday} flicker={claimedToday} />}
              value={streak}
              color={claimedToday ? theme.flame : theme.textFaint}
              onPress={() => router.push('/streak-info')}
            />
            <StatChip
              label={`${state.coins} coins`}
              icon={<CoinIcon size={20} />}
              value={state.coins}
              color={theme.goldShade}
              onPress={() => router.push({ pathname: '/vault', params: { tab: 'shop' } })}
            />
          </View>
        </View>
        <AppText variant="title" numberOfLines={1}>
          {greeting()}, {state.name}
        </AppText>
        <View style={styles.levelRow}>
          <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
            <AppText variant="micro" color="#FFFFFF" style={styles.levelText}>
              LV {level.level}
            </AppText>
          </View>
          <View style={styles.flex}>
            <ProgressBar progress={level.progress} color={theme.primary} track={theme.surfaceMuted} height={12} />
          </View>
          <AppText variant="captionStrong" color="textMuted">
            {level.into}/{level.need} XP
          </AppText>
        </View>
      </View>

      {state.notice?.kind === 'shield' && (
        <Pressable onPress={dismissNotice}>
          <Surface style={[styles.notice, { borderColor: theme.shield }]}>
            <View style={[styles.noticeIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon ios="shield.fill" md="shield" size={22} color={theme.shield} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">Streak Shield activated!</AppText>
              <AppText variant="caption" color="textMuted">
                It covered a missed day and saved your {state.notice.streak}-day streak. Tap to dismiss.
              </AppText>
            </View>
          </Surface>
        </Pressable>
      )}

      {giftStatus(state, today).available && <DailyGift />}

      <BuddyHero
        buddy={buddy}
        done={done}
        total={total}
        nextPack={state.packs[0]}
        packCount={state.packs.length}
        claimedToday={claimedToday}
        cheer={cheer}
        onOpenPack={openPack}
        onAddHabit={addHabit}
      />

      <Pressable onPress={() => router.push('/streak-info')} accessibilityRole="button" accessibilityLabel="Streak details">
        <WeekStrip state={state} today={today} streak={streak} />
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading">Today’s habits</AppText>
          {total > 0 && (
            <AppText variant="captionStrong" color={done === total ? 'success' : 'textMuted'}>
              {done === total ? 'All done!' : `${done} of ${total} done`}
            </AppText>
          )}
        </View>

        {state.habits.map((habit, i) => (
          <Animated.View key={habit.id} entering={FadeInDown.delay(i * 40).springify().damping(18)}>
            <HabitRow
              habit={habit}
              done={doneIds.includes(habit.id)}
              streak={habitStreak(state, habit.id, today)}
              onToggle={() => onToggle(habit.id)}
              onLongPress={() => {
                haptic.medium();
                router.push({ pathname: '/habit', params: { id: habit.id } });
              }}
            />
          </Animated.View>
        ))}

        <Pressable onPress={addHabit} accessibilityRole="button" accessibilityLabel="Add a new habit">
          {({ pressed }) => (
            <View
              style={[
                styles.addRow,
                { borderColor: theme.borderStrong, backgroundColor: pressed ? theme.surfaceMuted : 'transparent' },
              ]}>
              <Icon ios="plus.circle.fill" md="add" size={22} color={theme.primary} />
              <AppText variant="bodyStrong" color="primary">
                New habit
              </AppText>
            </View>
          )}
        </Pressable>

        {total > 0 && (
          <AppText variant="caption" color="textFaint" align="center">
            Tip: long-press a habit to edit or delete it
          </AppText>
        )}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: { paddingHorizontal: 10, height: 24, borderRadius: 12, justifyContent: 'center' },
  levelText: { letterSpacing: 0.5 },
  flex: { flex: 1 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noticeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
