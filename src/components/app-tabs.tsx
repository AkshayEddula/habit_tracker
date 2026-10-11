import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { claimableQuests } from '@/store/game';
import { useGameState, useToday } from '@/store/store';

export default function AppTabs() {
  const theme = useTheme();
  const state = useGameState();
  const today = useToday();
  const packs = state.packs.length;
  const quests = claimableQuests(state, today);

  return (
    <NativeTabs
      tintColor={theme.primary}
      minimizeBehavior="onScrollDown"
      backgroundColor={Platform.OS === 'android' ? theme.surface : undefined}
      indicatorColor={theme.primarySoft}
      labelStyle={{ selected: { color: theme.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="wb_sunny" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vault">
        <NativeTabs.Trigger.Label>Vault</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'sparkles.rectangle.stack', selected: 'sparkles.rectangle.stack.fill' }}
          md="style"
        />
        {/* `hidden` isn't honored on iOS, so only mount the badge when there's a count. */}
        {packs > 0 && <NativeTabs.Trigger.Badge>{String(packs)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="quests">
        <NativeTabs.Trigger.Label>Quests</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'scroll', selected: 'scroll.fill' }} md="military_tech" />
        {quests > 0 && <NativeTabs.Trigger.Badge>{String(quests)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
