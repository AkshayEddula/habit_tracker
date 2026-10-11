import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { SheetScaffold } from '@/components/sheet-scaffold';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { Glyph, Icon } from '@/components/ui/icon';
import { HABIT_ICONS, type IconName } from '@/constants/icons';
import { Font, type HabitColor, HabitColors, Radius, Squircle } from '@/constants/theme';
import { HABIT_TEMPLATES, suggestIcon } from '@/data/habit-templates';
import { useTheme } from '@/hooks/use-theme';
import { alpha, tint } from '@/lib/color';
import { confirmDestructive } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { addHabit, celebrate, deleteHabit, showToast, updateHabit, useGameState } from '@/store/store';

const ICON_GAP = 8;

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function HabitEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const state = useGameState();
  const theme = useTheme();
  const existing = state.habits.find((h) => h.id === id);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [icon, setIcon] = useState<IconName>(existing?.icon ?? 'star');
  const [color, setColor] = useState<HabitColor>(existing?.color ?? 'ember');
  const [iconPicked, setIconPicked] = useState(!!existing);
  const canSave = title.trim().length > 0;

  const { width } = useWindowDimensions();
  const gridW = Math.min(width, 560) - 46;
  const cols = 7;
  const cell = Math.floor((gridW - ICON_GAP * (cols - 1)) / cols);

  const onTitle = (text: string) => {
    setTitle(text);
    const guess = iconPicked ? null : suggestIcon(text);
    if (guess) setIcon(guess);
  };

  const suggestions = HABIT_TEMPLATES.filter(
    (t) => !state.habits.some((h) => h.title.toLowerCase() === t.title.toLowerCase()),
  ).slice(0, 8);

  const save = () => {
    if (!canSave) return;
    const input = { title: title.trim(), icon, color };
    if (existing) updateHabit(existing.id, input);
    else addHabit(input);
    haptic.success();
    close();
  };

  const remove = () => {
    if (!existing) return;
    confirmDestructive('Delete this habit?', `“${existing.title}” and its streak will be removed.`, 'Delete', () => {
      const perfect = deleteHabit(existing.id);
      close();
      if (perfect) {
        celebrate();
        showToast({ icon: 'party', title: 'Perfect day!', subtitle: 'Your daily pack is ready to open.' });
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SheetScaffold
        color={HabitColors[color]}
        rays={tint(HabitColors[color], 0.14)}
        onClose={close}
        hero={
          <>
            <View style={styles.heroIcon}>
              <Glyph name={icon} size={46} color={HabitColors[color]} />
            </View>
            <AppText variant="micro" color="rgba(255,255,255,0.9)" style={styles.heroKicker}>
              {existing ? 'Edit habit' : 'New habit'}
            </AppText>
            <AppText variant="title" color="#FFFFFF" align="center" numberOfLines={2}>
              {title.trim() || 'What will you do?'}
            </AppText>
            <View style={styles.heroPill}>
              <Glyph name="bolt" size={13} color="#FFFFFF" />
              <AppText variant="captionStrong" color="#FFFFFF">
                +10 XP every day you do it
              </AppText>
            </View>
          </>
        }>
        <View style={styles.field}>
          <AppText variant="micro" color="textMuted">
            Name
          </AppText>
          <TextInput
            value={title}
            onChangeText={onTitle}
            placeholder="e.g. Drink 8 glasses of water"
            placeholderTextColor={theme.textFaint}
            maxLength={40}
            autoFocus={!existing}
            returnKeyType="done"
            onSubmitEditing={save}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.surface, borderColor: canSave ? HabitColors[color] : theme.border },
            ]}
          />
        </View>

        {!existing && suggestions.length > 0 && (
          <View style={styles.field}>
            <AppText variant="micro" color="textMuted">
              Popular picks
            </AppText>
            <View style={styles.wrap}>
              {suggestions.map((t) => (
                <Pressable
                  key={t.title}
                  onPress={() => {
                    haptic.select();
                    setTitle(t.title);
                    setIcon(t.icon);
                    setColor(t.color);
                    setIconPicked(true);
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <Glyph name={t.icon} size={15} color={HabitColors[t.color]} />
                  <AppText variant="captionStrong">{t.title}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.field}>
          <AppText variant="micro" color="textMuted">
            Icon
          </AppText>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map((e) => {
              const active = e === icon;
              return (
                <Pressable
                  key={e}
                  onPress={() => {
                    haptic.select();
                    setIcon(e);
                    setIconPicked(true);
                  }}
                  style={[
                    styles.iconCell,
                    {
                      width: cell,
                      height: cell,
                      backgroundColor: active ? alpha(HabitColors[color], 0.18) : theme.surface,
                      borderColor: active ? HabitColors[color] : theme.border,
                    },
                  ]}>
                  <Glyph name={e} size={22} color={active ? HabitColors[color] : theme.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <AppText variant="micro" color="textMuted">
            Color
          </AppText>
          <View style={styles.colors}>
            {(Object.keys(HabitColors) as HabitColor[]).map((key) => {
              const active = key === color;
              return (
                <Pressable
                  key={key}
                  accessibilityLabel={`${key} color`}
                  onPress={() => {
                    haptic.select();
                    setColor(key);
                  }}
                  style={[styles.swatchRing, { borderColor: active ? HabitColors[key] : 'transparent' }]}>
                  <View style={[styles.swatch, { backgroundColor: HabitColors[key] }]}>
                    {active && <Icon ios="checkmark" md="check" size={16} color="#FFFFFF" weight="heavy" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ChunkyButton
          title={existing ? 'Save changes' : 'Add habit'}
          size="lg"
          disabled={!canSave}
          onPress={save}
          color={HabitColors[color]}
          shade={tint(HabitColors[color], -0.22)}
        />

        {existing && (
          <Pressable onPress={remove} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
            <Icon ios="trash" md="delete" size={18} color={theme.danger} />
            <AppText variant="bodyStrong" color="danger">
              Delete habit
            </AppText>
          </Pressable>
        )}
      </SheetScaffold>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 30,
    ...Squircle,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(0,0,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: { marginTop: 14 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginTop: 10,
  },
  field: { gap: 10 },
  input: {
    fontFamily: Font.bold,
    fontSize: 18,
    height: 58,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    ...Squircle,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, ...Squircle, borderWidth: 2, borderBottomWidth: 3 },
  pressed: { opacity: 0.7 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ICON_GAP },
  iconCell: {
    borderRadius: 14,
    ...Squircle,
    borderBottomWidth: 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchRing: { padding: 3, borderRadius: 24, borderWidth: 3 },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48 },
});
