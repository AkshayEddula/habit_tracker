import type { ReactNode } from 'react';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Squircle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';

type Props = {
  title: string;
  onPress?: () => void;
  color?: string;
  shade?: string;
  textColor?: string;
  icon?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = { sm: 40, md: 50, lg: 58 };
const DEPTH = { sm: 3, md: 4, lg: 5 };

/** Duolingo-style button whose face sinks into its edge when pressed. */
export function ChunkyButton({
  title,
  onPress,
  color,
  shade,
  textColor = '#FFFFFF',
  icon,
  disabled,
  size = 'md',
  variant = 'solid',
  style,
}: Props) {
  const theme = useTheme();
  const outline = variant === 'outline';
  const face = disabled ? theme.surfaceMuted : outline ? theme.surface : (color ?? theme.primary);
  const edge = disabled ? theme.borderStrong : outline ? theme.borderStrong : (shade ?? theme.primaryShade);
  const fg = disabled ? theme.textFaint : outline ? theme.text : textColor;
  const height = HEIGHT[size];
  const depth = DEPTH[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => {
        haptic.tap();
        playSound('tap');
        onPress?.();
      }}
      style={style}>
      {({ pressed }) => (
        <View style={[styles.edge, { height: height + depth, backgroundColor: edge }]}>
          <View
            style={[
              styles.face,
              {
                height,
                backgroundColor: face,
                transform: [{ translateY: pressed && !disabled ? depth : 0 }],
              },
              outline && { borderWidth: 2, borderColor: edge },
              size === 'sm' && styles.faceSmall,
            ]}>
            {icon}
            <AppText
              variant={size === 'lg' ? 'heading' : size === 'sm' ? 'captionStrong' : 'bodyStrong'}
              color={fg}
              style={styles.label}>
              {title}
            </AppText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: {
    borderRadius: Radius.md,
    ...Squircle,
  },
  face: {
    borderRadius: Radius.md,
    ...Squircle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  faceSmall: {
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  label: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
