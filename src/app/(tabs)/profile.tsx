import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, TextInput, useWindowDimensions, View } from 'react-native';

import { BouncyCritter } from '@/components/bouncy-critter';
import { Critter } from '@/components/critter';
import { AppText } from '@/components/ui/app-text';
import { Glyph, Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenScroll } from '@/components/ui/screen-scroll';
import { Surface } from '@/components/ui/surface';
import { Font, MaxContentWidth, Squircle } from '@/constants/theme';
import { CREATURES, ELEMENTS, getCreature, RARITIES } from '@/data/creatures';
import { useTheme } from '@/hooks/use-theme';
import { alpha } from '@/lib/color';
import { confirmDestructive } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import {
  addDays,
  currentStreak,
  levelInfo,
  parseKey,
  totalCheckins,
  weekOf,
} from '@/store/game';
import { resetProgress, setHaptics, setName, setSounds, useGameState, useToday } from '@/store/store';

const WEEKS = 15;
const CELL_GAP = 4;

export default function ProfileScreen() {
  const state = useGameState();
  const today = useToday();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.name);

  const buddy = getCreature(state.buddyId);
  const level = levelInfo(state.xp);
  const streak = currentStreak(state, today);
  const perfectCount = Object.keys(state.perfectDays).length;
  const checkins = totalCheckins(state);
  const discovered = Object.keys(state.collection).length;
  const since = parseKey(state.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Heatmap: WEEKS columns of Mon..Sun ending with the current week.
  const firstMonday = addDays(weekOf(today)[0], -(WEEKS - 1) * 7);
  const columns = Array.from({ length: WEEKS }, (_, w) => weekOf(addDays(firstMonday, w * 7)));
  const contentW = Math.min(width, MaxContentWidth) - 40 - 36;
  const cell = Math.max(10, Math.floor((contentW - CELL_GAP * (WEEKS - 1)) / WEEKS));
  const habitCount = Math.max(1, state.habits.length);

  const cellColor = (day: string) => {
    if (day > today) return 'transparent';
    if (state.perfectDays[day]) return theme.primary;
    if (state.shieldedDays[day]) return theme.shield;
    const n = state.completions[day]?.length ?? 0;
    if (n === 0) return theme.surfaceMuted;
    return alpha(theme.primary, 0.25 + 0.45 * Math.min(1, n / habitCount));
  };

  const saveName = () => {
    setName(draft);
    setEditing(false);
  };

  const recent = state.pulls.slice(0, 8);

  return (
    <ScreenScroll>
      <View>
        <AppText variant="micro" color="textMuted">
          Trainer card
        </AppText>
        <AppText variant="title">Profile</AppText>
      </View>

      <Surface style={styles.trainer}>
        <View style={styles.trainerTop}>
          <Pressable
            onPress={() => router.push({ pathname: '/card/[id]', params: { id: buddy.id } })}
            style={[styles.avatar, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}
            accessibilityLabel={`Your buddy ${buddy.name}`}>
            <BouncyCritter spec={buddy.spec} size={86} />
          </Pressable>
          <View style={styles.flex}>
            {editing ? (
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={saveName}
                onBlur={saveName}
                autoFocus
                maxLength={20}
                returnKeyType="done"
                style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.primary }]}
                placeholderTextColor={theme.textFaint}
              />
            ) : (
              <Pressable
                onPress={() => {
                  setDraft(state.name);
                  setEditing(true);
                }}
                style={styles.nameRow}
                accessibilityLabel="Edit name">
                <AppText variant="title" numberOfLines={1} style={styles.shrink}>
                  {state.name}
                </AppText>
                <Icon ios="pencil" md="edit" size={16} color={theme.textFaint} />
              </Pressable>
            )}
            <AppText variant="captionStrong" color="textMuted">
              Level {level.level} Trainer · since {since}
            </AppText>
          </View>
        </View>
        <View style={styles.xp}>
          <ProgressBar progress={level.progress} color={theme.primary} track={theme.surfaceMuted} height={14} />
          <AppText variant="captionStrong" color="textMuted">
            {level.need - level.into} XP to level {level.level + 1}
          </AppText>
        </View>
      </Surface>

      <View style={styles.stats}>
        {[
          { icon: 'flame' as const, color: theme.flame, value: streak, label: 'Current streak' },
          { icon: 'trophy' as const, color: theme.gold, value: state.bestStreak, label: 'Best streak' },
          { icon: 'star' as const, color: theme.gold, value: perfectCount, label: 'Perfect days' },
          { icon: 'check' as const, color: theme.primary, value: checkins, label: 'Check-ins' },
        ].map((s) => (
          <Surface key={s.label} style={styles.stat}>
            <Glyph name={s.icon} size={26} color={s.color} />
            <AppText variant="title">{s.value}</AppText>
            <AppText variant="captionStrong" color="textMuted">
              {s.label}
            </AppText>
          </Surface>
        ))}
      </View>

      <Surface style={styles.block}>
        <View style={styles.blockHead}>
          <AppText variant="heading">Activity</AppText>
          <AppText variant="captionStrong" color="textMuted">
            Last {WEEKS} weeks
          </AppText>
        </View>
        <View style={[styles.heatmap, { gap: CELL_GAP }]}>
          {columns.map((col) => (
            <View key={col[0]} style={{ gap: CELL_GAP }}>
              {col.map((day) => (
                <View
                  key={day}
                  style={{
                    width: cell,
                    height: cell,
                    borderRadius: cell * 0.3,
                    ...Squircle,
                    backgroundColor: cellColor(day),
                    borderWidth: day === today ? 2 : 0,
                    borderColor: theme.text,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <AppText variant="caption" color="textFaint">
            Less
          </AppText>
          {[theme.surfaceMuted, alpha(theme.primary, 0.3), alpha(theme.primary, 0.55), theme.primary].map((c) => (
            <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
          ))}
          <AppText variant="caption" color="textFaint">
            Perfect
          </AppText>
        </View>
      </Surface>

      {recent.length > 0 && (
        <Surface style={styles.block}>
          <View style={styles.blockHead}>
            <AppText variant="heading">Recent catches</AppText>
            <AppText variant="captionStrong" color="textMuted">
              {discovered}/{CREATURES.length} found
            </AppText>
          </View>
          <View style={styles.catches}>
            {recent.map((p, i) => {
              const c = getCreature(p.creatureId);
              return (
                <Pressable
                  key={`${p.creatureId}-${i}`}
                  onPress={() => router.push({ pathname: '/card/[id]', params: { id: c.id } })}
                  style={styles.catch}>
                  <View
                    style={[
                      styles.catchArt,
                      { backgroundColor: alpha(ELEMENTS[c.element].color, 0.14), borderColor: RARITIES[c.rarity].color },
                    ]}>
                    <Critter spec={c.spec} size={52} />
                  </View>
                  <AppText variant="caption" numberOfLines={1} color="textMuted">
                    {c.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Surface>
      )}

      <Surface style={styles.settings}>
        {Platform.OS !== 'web' && (
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <Icon ios="iphone.radiowaves.left.and.right" md="vibration" size={20} color={theme.textMuted} />
            <AppText variant="bodyStrong" style={styles.flex}>
              Haptic feedback
            </AppText>
            <Switch
              value={state.settings.haptics}
              onValueChange={(v) => {
                setHaptics(v);
                if (v) haptic.success();
              }}
              trackColor={{ true: theme.primary, false: theme.surfaceMuted }}
            />
          </View>
        )}
        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Icon ios="speaker.wave.2.fill" md="volume_up" size={20} color={theme.textMuted} />
          <AppText variant="bodyStrong" style={styles.flex}>
            Sound effects
          </AppText>
          <Switch
            value={state.settings.sounds}
            onValueChange={(v) => {
              setSounds(v);
              if (v) setTimeout(() => playSound('check'), 50);
            }}
            trackColor={{ true: theme.primary, false: theme.surfaceMuted }}
          />
        </View>
        <Pressable
          onPress={() => router.push('/badges')}
          style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.6 }]}>
          <Icon ios="medal.fill" md="military_tech" size={20} color={theme.gold} />
          <AppText variant="bodyStrong" style={styles.flex}>
            Badges
          </AppText>
          <Icon ios="chevron.right" md="chevron_right" size={16} color={theme.textFaint} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/gallery')}
          style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.6 }]}>
          <Icon ios="square.grid.2x2.fill" md="grid_view" size={20} color={theme.primary} />
          <AppText variant="bodyStrong" style={styles.flex}>
            See all Habitlings (test)
          </AppText>
          <Icon ios="chevron.right" md="chevron_right" size={16} color={theme.textFaint} />
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/streak', params: { preview: '1' } })}
          style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.6 }]}>
          <Icon ios="flame.fill" md="local_fire_department" size={20} color={theme.flame} />
          <AppText variant="bodyStrong" style={styles.flex}>
            Preview streak celebration
          </AppText>
          <Icon ios="chevron.right" md="chevron_right" size={16} color={theme.textFaint} />
        </Pressable>
        <Pressable
          onPress={() =>
            confirmDestructive(
              'Reset all progress?',
              'This deletes your habits, streaks, coins and every critter you have collected. This cannot be undone.',
              'Reset',
              resetProgress,
            )
          }
          style={({ pressed }) => [styles.settingRow, styles.lastRow, pressed && { opacity: 0.6 }]}>
          <Icon ios="arrow.counterclockwise" md="refresh" size={20} color={theme.danger} />
          <AppText variant="bodyStrong" color="danger" style={styles.flex}>
            Reset progress
          </AppText>
        </Pressable>
      </Surface>

      <AppText variant="caption" color="textFaint" align="center">
        Habitlings · build habits, catch critters
      </AppText>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  trainer: { gap: 16, padding: 18 },
  trainerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    fontFamily: Font.black,
    fontSize: 24,
    borderBottomWidth: 2,
    paddingVertical: 2,
  },
  xp: { gap: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexBasis: '46%', flexGrow: 1, gap: 2 },
  block: { gap: 14 },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heatmap: { flexDirection: 'row', alignSelf: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  legendCell: { width: 12, height: 12, borderRadius: 4 },
  catches: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  catch: { width: '25%', alignItems: 'center', gap: 4 },
  catchArt: {
    width: 64,
    height: 64,
    borderRadius: 20,
    ...Squircle,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settings: { paddingVertical: 4 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastRow: { borderBottomWidth: 0 },
});
