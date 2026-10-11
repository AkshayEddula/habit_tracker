import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Flame } from '@/components/flame';
import { Twinkle } from '@/components/flood';
import { Rays, Spin } from '@/components/holo';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { Glyph, Icon } from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { Banner, Font, Squircle } from '@/constants/theme';
import { useMidnightCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import {
  addDays,
  currentStreak,
  dateKey,
  MAX_SHIELDS,
  nextMilestone,
  parseKey,
  STREAK_MILESTONES,
  weekOf,
} from '@/store/game';
import { useGameState, useToday } from '@/store/store';

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ORANGE = Banner.orange;

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Month grid (Monday first) for the month containing `today`. */
function monthDays(today: string) {
  const d = parseKey(today);
  const first = dateKey(new Date(d.getFullYear(), d.getMonth(), 1, 12));
  const count = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const lead = (parseKey(first).getDay() + 6) % 7;
  return {
    title: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    cells: [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: count }, (_, i) => addDays(first, i)),
    ],
  };
}

/**
 * Streak details, opened from the streak chip on Today. Laid out like the streak celebration:
 * a full-bleed hero with the flame and count, and a white panel curving up beneath it.
 */
export default function StreakInfo() {
  const state = useGameState();
  const today = useToday();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const countdown = useMidnightCountdown();

  const streak = currentStreak(state, today);
  const extended = !!state.perfectDays[today];
  const next = nextMilestone(streak);
  const month = monthDays(today);
  const kept = (d: string | null) => !!d && (!!state.perfectDays[d] || !!state.shieldedDays[d]);
  const left = Math.max(0, state.habits.length - (state.completions[today]?.length ?? 0));

  // Road of milestones: the last one reached plus the next ones.
  const firstAhead = STREAK_MILESTONES.findIndex((m) => m > streak);
  const start = Math.max(0, (firstAhead === -1 ? STREAK_MILESTONES.length : firstAhead) - 1);
  const road = STREAK_MILESTONES.slice(start, start + 4);

  const stats: { icon: IconName; color: string; value: string; label: string }[] = [
    { icon: 'trophy', color: theme.gold, value: String(state.bestStreak), label: 'Best' },
    { icon: 'star', color: theme.gold, value: String(Object.keys(state.perfectDays).length), label: 'Perfect days' },
    { icon: 'target', color: theme.flame, value: `${Math.min(streak, state.streakGoal)}/${state.streakGoal}`, label: 'Goal' },
    { icon: 'shield', color: theme.shield, value: `${state.shields}/${MAX_SHIELDS}`, label: 'Shields' },
  ];

  // Lit: the warm orange of the celebration. Not yet extended today: a calm, unlit version.
  const heroBg = extended ? ORANGE.face : '#F1EEEA';
  const heroText = extended ? '#FFFFFF' : '#8C8479';

  return (
    <View style={[styles.root, { backgroundColor: heroBg }]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 18 }]}>
          {extended && (
            <View style={styles.rays}>
              <Spin duration={40000}>
                <Rays size={620} color="#FFB937" opacity={0.7} count={16} />
              </Spin>
            </View>
          )}
          {extended && (
            <>
              <Twinkle x={44} y={insets.top + 60} size={18} delay={200} />
              <Twinkle x={300} y={insets.top + 44} size={24} delay={600} />
              <Twinkle x={322} y={insets.top + 170} size={14} delay={1000} />
            </>
          )}
          <Flame size={128} lit={extended} face tone="bright" />
          <AppText style={[styles.number, { color: heroText }]}>{streak}</AppText>
          <AppText variant="title" color={heroText} style={styles.label}>
            day streak
          </AppText>
          <View style={[styles.status, { backgroundColor: extended ? 'rgba(0,0,0,0.12)' : '#FFFFFF' }]}>
            <Icon
              ios={extended ? 'checkmark.circle.fill' : 'clock.fill'}
              md={extended ? 'check_circle' : 'schedule'}
              size={16}
              color={extended ? '#FFFFFF' : ORANGE.face}
            />
            <AppText variant="captionStrong" color={extended ? '#FFFFFF' : theme.text}>
              {extended
                ? 'Extended today. See you tomorrow!'
                : state.habits.length === 0
                  ? 'Add a habit to start your streak'
                  : `${left} habit${left === 1 ? '' : 's'} left · ${countdown} to go`}
            </AppText>
          </View>
        </View>

        {/* Panel */}
        <View style={[styles.panel, { paddingBottom: insets.bottom + 28 }]}>
          <View style={styles.week}>
            {weekOf(today).map((d, i) => {
              const lit = kept(d);
              const isToday = d === today;
              return (
                <View key={d} style={styles.weekDay}>
                  <AppText variant="micro" color={isToday ? ORANGE.face : 'textFaint'} style={styles.noSpacing}>
                    {LABELS[i]}
                  </AppText>
                  <View
                    style={[
                      styles.weekDot,
                      lit
                        ? { backgroundColor: state.shieldedDays[d] ? theme.shield : ORANGE.face, borderColor: 'transparent' }
                        : { borderColor: isToday ? ORANGE.face : theme.border },
                    ]}>
                    {lit && <Glyph name={state.shieldedDays[d] ? 'shield' : 'flame'} size={17} color="#FFFFFF" />}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.stats, { backgroundColor: theme.surfaceMuted }]}>
            {stats.map((s, i) => (
              <View key={s.label} style={[styles.stat, i > 0 && { borderLeftWidth: 2, borderLeftColor: '#FFFFFF' }]}>
                <Glyph name={s.icon} size={18} color={s.color} />
                <AppText variant="heading">{s.value}</AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.statLabel}>
                  {s.label}
                </AppText>
              </View>
            ))}
          </View>

          {/* Rewards road */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <AppText variant="heading">Next rewards</AppText>
              <AppText variant="captionStrong" color="flame">
                {next - streak} day{next - streak === 1 ? '' : 's'} to go
              </AppText>
            </View>
            <View style={styles.road}>
              <View style={[styles.roadLine, { backgroundColor: theme.surfaceMuted }]} />
              {road.map((m) => {
                const reached = streak >= m;
                const isNext = m === next;
                return (
                  <View key={m} style={styles.stop}>
                    <View
                      style={[
                        styles.stopDot,
                        reached
                          ? { backgroundColor: theme.primary, borderBottomColor: theme.primaryShade }
                          : isNext
                            ? { backgroundColor: theme.gold, borderBottomColor: theme.goldShade }
                            : { backgroundColor: theme.surfaceMuted, borderBottomColor: theme.border },
                      ]}>
                      <Glyph name={reached ? 'check' : 'gift'} size={20} color={reached || isNext ? '#FFFFFF' : theme.textFaint} />
                    </View>
                    <AppText variant="captionStrong" color={reached ? 'primary' : isNext ? 'goldShade' : 'textFaint'}>
                      {m} days
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Calendar */}
          <View style={styles.section}>
            <AppText variant="heading">{month.title}</AppText>
            <View style={styles.grid}>
              {LABELS.map((l, i) => (
                <View key={`l${i}`} style={styles.cell}>
                  <AppText variant="micro" color="textFaint" style={styles.noSpacing}>
                    {l}
                  </AppText>
                </View>
              ))}
              {month.cells.map((d, i) => {
                if (!d) return <View key={`b${i}`} style={styles.cell} />;
                const on = kept(d);
                const col = i % 7;
                // Consecutive kept days in the same row join into one pill.
                const joinLeft = on && col > 0 && kept(month.cells[i - 1]);
                const joinRight = on && col < 6 && kept(month.cells[i + 1] ?? null);
                const isToday = d === today;
                return (
                  <View key={d} style={styles.cell}>
                    {joinLeft && <View style={[styles.join, styles.joinLeft]} />}
                    {joinRight && <View style={[styles.join, styles.joinRight]} />}
                    <View
                      style={[
                        styles.day,
                        on && { backgroundColor: state.shieldedDays[d] ? theme.shield : ORANGE.face },
                        isToday && !on && { borderWidth: 2.5, borderColor: ORANGE.face },
                      ]}>
                      <AppText
                        variant="captionStrong"
                        color={on ? '#FFFFFF' : d > today ? 'textFaint' : isToday ? 'flame' : 'textMuted'}>
                        {parseKey(d).getDate()}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {state.shields < MAX_SHIELDS && (
            <View style={[styles.shield, { backgroundColor: theme.primarySoft }]}>
              <Glyph name="shield" size={24} color={theme.shield} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">Protect your streak</AppText>
                <AppText variant="caption" color="textMuted">
                  A Streak Shield covers one missed day.
                </AppText>
              </View>
              <ChunkyButton
                title="Get"
                size="sm"
                onPress={() => {
                  close();
                  router.push({ pathname: '/vault', params: { tab: 'shop' } });
                }}
              />
            </View>
          )}

          <ChunkyButton
            title="Preview streak celebration"
            variant="outline"
            icon={<Icon ios="play.fill" md="play_arrow" size={16} color={theme.flame} />}
            onPress={() => {
              haptic.tap();
              router.push({ pathname: '/streak', params: { preview: '1' } });
            }}
          />
        </View>
      </ScrollView>

      <Pressable
        onPress={close}
        style={[styles.close, { top: insets.top + 12, backgroundColor: extended ? 'rgba(0,0,0,0.14)' : '#FFFFFF' }]}
        accessibilityLabel="Close"
        hitSlop={10}>
        <Icon ios="xmark" md="close" size={16} color={extended ? '#FFFFFF' : theme.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingBottom: 54, overflow: 'hidden' },
  rays: { position: 'absolute', top: -150, alignSelf: 'center', pointerEvents: 'none' },
  number: { fontFamily: Font.black, fontSize: 88, lineHeight: 96, marginTop: 2 },
  label: { marginTop: -8 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    marginTop: 12,
  },
  close: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    flexGrow: 1,
    marginTop: -30,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderCurve: 'continuous',
    paddingHorizontal: 22,
    paddingTop: 26,
    gap: 24,
  },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 8, flex: 1 },
  weekDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  noSpacing: { letterSpacing: 0 },
  stats: { flexDirection: 'row', borderRadius: 20, ...Squircle, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 1 },
  statLabel: { fontSize: 11 },
  section: { gap: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  road: { flexDirection: 'row', justifyContent: 'space-between' },
  roadLine: { position: 'absolute', left: 30, right: 30, top: 22, height: 6, borderRadius: 3 },
  stop: { alignItems: 'center', gap: 6 },
  stopDot: { width: 50, height: 50, borderRadius: 25, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  join: { position: 'absolute', top: 4, bottom: 4, width: '50%', backgroundColor: '#FFD9A6' },
  joinLeft: { left: 0 },
  joinRight: { right: 0 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  shield: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, ...Squircle },
});
