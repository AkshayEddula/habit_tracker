import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { TabList, type TabListProps, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { claimableQuests } from '@/store/game';
import { useGameState, useToday } from '@/store/store';

export default function AppTabs() {
  const state = useGameState();
  const today = useToday();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton ios="sun.max.fill" md="wb_sunny">
              Today
            </TabButton>
          </TabTrigger>
          <TabTrigger name="vault" href="/vault" asChild>
            <TabButton ios="sparkles.rectangle.stack.fill" md="style" badge={state.packs.length}>
              Vault
            </TabButton>
          </TabTrigger>
          <TabTrigger name="quests" href="/quests" asChild>
            <TabButton ios="scroll.fill" md="military_tech" badge={claimableQuests(state, today)}>
              Quests
            </TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton ios="person.crop.circle.fill" md="account_circle">
              Profile
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { ios: SFSymbol; md: AndroidSymbol; badge?: number };

export function TabButton({ children, isFocused, ios, md, badge = 0, ...props }: TabButtonProps) {
  const theme = useTheme();
  const color = isFocused ? theme.primary : theme.textFaint;
  return (
    <Pressable {...props} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={[styles.iconPill, isFocused && { backgroundColor: theme.primarySoft }]}>
        <Icon ios={ios} md={md} size={24} color={color} />
        {badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.surface }]}>
            <AppText variant="micro" color="#FFFFFF" style={styles.badgeText}>
              {badge}
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="captionStrong" color={color} style={styles.label}>
        {children}
      </AppText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.container}>
      <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  bar: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 28,
    borderWidth: 2,
    boxShadow: '0 10px 30px rgba(43, 26, 12, 0.14)',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  iconPill: {
    width: 52,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12 },
  badge: {
    position: 'absolute',
    top: -4,
    right: 6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { letterSpacing: 0, fontSize: 10 },
});
