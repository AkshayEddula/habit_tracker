import { Platform, ScrollView, type ScrollViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Root scroll view for tab screens. iOS native tabs adjust the first ScrollView's insets
 * automatically and Android applies the bottom inset, so only the remaining edges are padded here.
 */
export function ScreenScroll({ contentContainerStyle, style, ...rest }: ScrollViewProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.bg }, style]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        Platform.select({
          ios: { paddingTop: Spacing.two, paddingBottom: Spacing.five },
          android: { paddingTop: insets.top + Spacing.three, paddingBottom: Spacing.five },
          default: { paddingTop: Spacing.five, paddingBottom: BottomTabInset + Spacing.three },
        }),
        contentContainerStyle,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
});
