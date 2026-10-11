import { StyleSheet, Text, type TextProps } from 'react-native';

import { Font, type Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong'
  | 'micro';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  /** A palette token or any raw color. */
  color?: keyof Palette | (string & {});
  align?: 'left' | 'center' | 'right';
};

export function AppText({ variant = 'body', color, align, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  const resolved = color ? ((theme as Record<string, string>)[color] ?? color) : theme.text;
  return (
    <Text
      style={[styles[variant], { color: resolved }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: Font.black, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: Font.black, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: Font.heavy, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: Font.semibold, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: Font.heavy, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: Font.semibold, fontSize: 13, lineHeight: 18 },
  captionStrong: { fontFamily: Font.heavy, fontSize: 13, lineHeight: 18 },
  micro: {
    fontFamily: Font.heavy,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
