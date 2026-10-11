import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { CoinIcon, Icon } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Squircle } from '@/constants/theme';
import { useMidnightCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { GIFT_CYCLE, giftStatus } from '@/store/game';
import { claimDailyGift, useGameState, useToday } from '@/store/store';

/** Seven-day login reward. Each day in a row is worth more; missing a day restarts the week. */
export function DailyGift() {
  const state = useGameState();
  const today = useToday();
  const theme = useTheme();
  const countdown = useMidnightCountdown();
  const st = giftStatus(state, today);

  const onClaim = () => {
    const r = claimDailyGift();
    if (!r) return;
    router.push({
      pathname: '/reward',
      params: {
        kind: 'coins',
        value: String(r.coins),
        title: `Day ${r.day + 1} gift!`,
        message: r.pack ? 'A full week! A Bonus Pack is waiting in your Vault too.' : 'Come back tomorrow for an even bigger gift.',
      },
    });
  };

  return (
    <Surface style={[styles.card, st.available && { borderColor: theme.gold, backgroundColor: theme.goldSoft }]}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: theme.gold }]}>
          <Icon ios="gift.fill" md="redeem" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Daily gift</AppText>
          <AppText variant="caption" color="textMuted">
            {st.available ? `Day ${st.day + 1} of 7 is ready` : `Next gift in ${countdown}`}
          </AppText>
        </View>
        {st.available && (
          <ChunkyButton
            title="Claim"
            size="sm"
            color={theme.gold}
            shade={theme.goldShade}
            textColor={theme.goldText}
            onPress={onClaim}
          />
        )}
      </View>
      <View style={styles.days}>
        {GIFT_CYCLE.map((reward, i) => {
          const collected = i < st.day || (i === st.day && !st.available);
          const isToday = i === st.day && st.available;
          return (
            <View
              key={i}
              style={[
                styles.day,
                {
                  backgroundColor: collected ? theme.primary : isToday ? theme.gold : theme.surfaceMuted,
                  borderBottomColor: collected ? theme.primaryShade : isToday ? theme.goldShade : theme.border,
                },
              ]}>
              {collected ? (
                <Icon ios="checkmark" md="check" size={14} color="#FFFFFF" weight="heavy" />
              ) : reward.pack ? (
                <Icon ios="gift.fill" md="redeem" size={15} color={isToday ? '#FFFFFF' : theme.textFaint} />
              ) : (
                <>
                  <CoinIcon size={12} />
                  <AppText variant="micro" color={isToday ? theme.goldText : 'textMuted'} style={styles.amount}>
                    {reward.coins}
                  </AppText>
                </>
              )}
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, ...Squircle, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    ...Squircle,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  amount: { letterSpacing: 0, fontSize: 10, lineHeight: 12 },
});
