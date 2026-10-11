import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing, Squircle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Card surface with a chunky bottom edge, the base of most blocks in the app. */
export function Surface({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.base, { backgroundColor: theme.surface, borderColor: theme.border }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    padding: Spacing.three,
    ...Squircle,
  },
});
