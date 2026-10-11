import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type Props = { icon: ReactNode; value: string | number; color: string; onPress?: () => void; label?: string };

export function StatChip({ icon, value, color, onPress, label }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
      <View style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {icon}
        <AppText variant="bodyStrong" color={color}>
          {value}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 2,
    borderBottomWidth: 3,
  },
});
