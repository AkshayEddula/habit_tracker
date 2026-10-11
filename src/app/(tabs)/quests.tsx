import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { DailyGift } from '@/components/daily-gift';
import { Flame } from '@/components/flame';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { CoinIcon, Glyph, Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenScroll } from '@/components/ui/screen-scroll';
import { StatChip } from '@/components/ui/stat-chip';
import { Surface } from '@/components/ui/surface';
import { Banner, Radius, Squircle } from '@/constants/theme';
import { useMidnightCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { alpha } from '@/lib/color';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import {
  ACHIEVEMENTS,
  chestStatus,
  currentStreak,
  DAILY_CHEST_COINS,
  nextMilestone,
  PACK_INFO,
  parseKey,
  type Quest,
  QUESTS,
  questStatus,
} from '@/store/game';
import { claimDailyChest, claimQuest, showToast, useGameState, useToday } from '@/store/store';

const G = Banner.orange;
const QUEST_TINTS = ['#FF9600', '#1FB98B', '#FF5C8A', '#58CC02', '#F0B400', '#FF6F5B'];

function QuestRow({ quest, tint, last }: { quest: Quest; tint: string; last: boolean }) {
  const state = useGameState();
  const today = useToday();
  const theme = useTheme();
  const st = questStatus(state, quest, today);
  const claimable = st.complete && !st.claimed;
  const reward = quest.reward.pack ? 'Pack' : `${quest.reward.coins}`;

  const onClaim = () => {
    const r = claimQuest(quest.id);
    if (!r) return;
    haptic.success();
    playSound('coin');
    showToast(
      r.pack
        ? { icon: 'gift', color: theme.flame, title: `${PACK_INFO[r.pack].title} earned!`, subtitle: 'It’s waiting in your Vault.' }
        : { icon: 'coin', color: theme.gold, title: `+${r.coins} coins`, subtitle: `Quest complete: ${quest.title}` },
    );
  };

  return (
    <View style={[styles.quest, !last && { borderBottomWidth: 2, borderBottomColor: theme.border }]}>
      <View style={[styles.questIcon, { backgroundColor: st.claimed ? theme.surfaceMuted : alpha(tint, 0.15) }]}>
        <Glyph name={st.claimed ? 'check' : quest.icon} size={22} color={st.claimed ? theme.primary : tint} />
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" color={st.claimed ? 'textMuted' : 'text'}>
          {quest.title}
        </AppText>
        {st.claimed ? (
          <AppText variant="caption" color="textFaint">
            Reward collected
          </AppText>
        ) : (
          <View style={styles.questProgress}>
            <View style={styles.flex}>
              <ProgressBar
                progress={st.value / st.target}
                color={st.complete ? theme.primary : tint}
                track={theme.surfaceMuted}
                height={14}
              />
            </View>
            <AppText variant="captionStrong" color="textMuted" style={styles.count}>
              {st.value}/{st.target}
            </AppText>
          </View>
        )}
        {!st.claimed && (
          <AppText variant="caption" color="textMuted">
            {quest.description}
          </AppText>
        )}
      </View>
      {claimable ? (
        <ChunkyButton
          title="Claim"
          size="sm"
          color={theme.gold}
          shade={theme.goldShade}
          textColor={theme.goldText}
          onPress={onClaim}
        />
      ) : (
        !st.claimed && (
          <View style={[styles.reward, { backgroundColor: theme.goldSoft }]}>
            {quest.reward.pack ? <Glyph name="gift" size={14} color={theme.goldShade} /> : <CoinIcon size={16} />}
            <AppText variant="captionStrong" color="goldShade">
              {reward}
            </AppText>
          </View>
        )
      )}
    </View>
  );
}

export default function QuestsScreen() {
  const state = useGameState();
  const today = useToday();
  const theme = useTheme();
  const countdown = useMidnightCountdown();

  const streak = currentStreak(state, today);
  const next = nextMilestone(streak);
  const daysToMonday = 7 - ((parseKey(today).getDay() + 6) % 7);
  const daily = QUESTS.filter((q) => q.period === 'daily');
  const weekly = QUESTS.filter((q) => q.period === 'weekly');
  const chest = chestStatus(state, today);
  const chestReady = chest.complete && !chest.claimed;
  const badges = ACHIEVEMENTS.filter((a) => a.unlocked(state)).length;

  const openChest = () => {
    const coins = claimDailyChest();
    if (!coins) return;
    router.push({
      pathname: '/reward',
      params: { kind: 'coins', value: String(coins), title: 'Daily chest opened!', message: 'Every daily quest done. That’s how streaks are built!' },
    });
  };

  return (
    <ScreenScroll>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="micro" color="textMuted">
            Earn rewards
          </AppText>
          <AppText variant="title">Quests</AppText>
        </View>
        <StatChip label={`${state.coins} coins`} icon={<CoinIcon size={20} />} value={state.coins} color={theme.goldShade} />
      </View>

      {/* Daily chest */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <AppText variant="micro" color={G.text} style={styles.dim}>
              Daily chest
            </AppText>
            <AppText variant="title" color={G.text}>
              {chest.claimed ? 'Chest opened!' : chestReady ? 'Your chest is ready' : `${chest.total - chest.done} quest${chest.total - chest.done === 1 ? '' : 's'} to go`}
            </AppText>
            <AppText variant="captionStrong" color={G.text} style={styles.dim}>
              {chest.claimed
                ? `A new chest arrives in ${countdown}.`
                : chestReady
                  ? `All daily quests done. Open it for ${DAILY_CHEST_COINS} bonus coins!`
                  : `Finish all ${chest.total} daily quests for a bonus ${DAILY_CHEST_COINS} coins.`}
            </AppText>
          </View>
          <View style={styles.chest}>
            <Glyph name={chest.claimed ? 'check' : 'gift'} size={38} color={chest.claimed ? '#58CC02' : G.face} />
          </View>
        </View>
        <View style={styles.pips}>
          {daily.map((q, i) => (
            <View key={q.id} style={[styles.pip, { backgroundColor: i < chest.done ? '#FFFFFF' : 'rgba(0,0,0,0.12)' }]} />
          ))}
        </View>
        {chestReady && (
          <ChunkyButton title="Open chest" color="#FFFFFF" shade="#FFD9A6" textColor={G.edge} onPress={openChest} />
        )}
      </View>

      <DailyGift />

      {/* Streak shortcut */}
      <Pressable onPress={() => router.push('/streak-info')} accessibilityLabel="Streak details">
        <Surface style={styles.streak}>
          <View style={[styles.streakFlame, { backgroundColor: theme.flameSoft }]}>
            <Flame size={30} lit={!!state.perfectDays[today]} face />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">
              {streak}-day streak
            </AppText>
            <AppText variant="caption" color="textMuted">
              {next - streak} more day{next - streak === 1 ? '' : 's'} to a Streak Pack
            </AppText>
          </View>
          <Icon ios="chevron.right" md="chevron_right" size={16} color={theme.textFaint} />
        </Surface>
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading">Daily quests</AppText>
          <View style={[styles.timer, { backgroundColor: theme.surfaceMuted }]}>
            <Icon ios="clock.fill" md="schedule" size={13} color={theme.textMuted} />
            <AppText variant="captionStrong" color="textMuted">
              {countdown}
            </AppText>
          </View>
        </View>
        <Surface style={styles.list}>
          {daily.map((q, i) => (
            <QuestRow key={q.id} quest={q} tint={QUEST_TINTS[i]} last={i === daily.length - 1} />
          ))}
        </Surface>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading">Weekly quests</AppText>
          <View style={[styles.timer, { backgroundColor: theme.surfaceMuted }]}>
            <Icon ios="calendar" md="calendar_month" size={13} color={theme.textMuted} />
            <AppText variant="captionStrong" color="textMuted">
              {daysToMonday} day{daysToMonday === 1 ? '' : 's'}
            </AppText>
          </View>
        </View>
        <Surface style={styles.list}>
          {weekly.map((q, i) => (
            <QuestRow key={q.id} quest={q} tint={QUEST_TINTS[i + 3]} last={i === weekly.length - 1} />
          ))}
        </Surface>
      </View>

      <Pressable onPress={() => router.push('/badges')} accessibilityRole="button" accessibilityLabel="See all badges">
        <Surface style={styles.badgeCard}>
          <View style={styles.sectionHead}>
            <AppText variant="heading">Badges</AppText>
            <View style={styles.seeAll}>
              <AppText variant="captionStrong" color="primary">
                {badges} of {ACHIEVEMENTS.length} · See all
              </AppText>
              <Icon ios="chevron.right" md="chevron_right" size={13} color={theme.primary} />
            </View>
          </View>
          <View style={styles.badgeRow}>
            {[...ACHIEVEMENTS]
              .sort((a, b) => Number(b.unlocked(state)) - Number(a.unlocked(state)))
              .slice(0, 5)
              .map((a) => (
                <Badge key={a.id} shape={a.shape} tone={a.tone} icon={a.icon} size={54} locked={!a.unlocked(state)} />
              ))}
          </View>
        </Surface>
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  hero: {
    backgroundColor: G.face,
    borderRadius: Radius.xl,
    ...Squircle,
    borderBottomWidth: 6,
    borderBottomColor: G.edge,
    padding: 18,
    gap: 14,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dim: { opacity: 0.8 },
  chest: {
    width: 76,
    height: 76,
    borderRadius: 24,
    ...Squircle,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 5,
    borderBottomColor: '#FFD9A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pips: { flexDirection: 'row', gap: 6 },
  pip: { flex: 1, height: 12, borderRadius: 6 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  streakFlame: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 13 },
  list: { paddingVertical: 2, paddingHorizontal: 16 },
  quest: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  questIcon: { width: 48, height: 48, borderRadius: 16, ...Squircle, alignItems: 'center', justifyContent: 'center' },
  questProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  count: { minWidth: 34, textAlign: 'right' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 30, borderRadius: 15 },
  badgeCard: { gap: 12 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
