import '@/global.css';

import { Platform } from 'react-native';

/**
 * Duolingo-style light palette: crisp white, grey borders with chunky bottom edges,
 * bright flat accents. Product rules: light mode only, no purple or blue in the UI.
 */
const light = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F4',
  border: '#E5E5E5',
  borderStrong: '#D4D4D4',
  text: '#3C3C3C',
  textMuted: '#777777',
  textFaint: '#AFAFAF',
  primary: '#58CC02',
  primaryShade: '#58A700',
  primarySoft: '#E5F8D4',
  success: '#58CC02',
  successShade: '#58A700',
  flame: '#FF9600',
  flameSoft: '#FFF0D9',
  gold: '#FFC800',
  goldShade: '#E0A800',
  goldSoft: '#FFF7D1',
  goldText: '#6B4E00',
  shield: '#1FB98B',
  danger: '#FF4B4B',
  dangerSoft: '#FFE3E3',
};

export const Colors = { light, dark: light };

export type Palette = typeof light;

/** Nunito weights loaded in the root layout. Custom fonts carry their own weight, so never pair them with `fontWeight`. */
export const Font = {
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

/** Flat, chunky banner colors (face + darker bottom edge). */
export const Banner = {
  green: { face: '#58CC02', edge: '#58A700', text: '#FFFFFF', soft: 'rgba(255,255,255,0.22)', button: '#4A9E00' },
  gold: { face: '#FFC800', edge: '#E0A800', text: '#5C4100', soft: 'rgba(255,255,255,0.4)', button: '#B98A00' },
  orange: { face: '#FF9600', edge: '#E07F00', text: '#FFFFFF', soft: 'rgba(255,255,255,0.22)', button: '#C86F00' },
} as const;

export const Gold = {
  light: '#FFE58A',
  base: '#FFC800',
  deep: '#E0A800',
  text: '#8A6300',
} as const;

/** Apple-style continuous ("squircle") corners. Use on rounded rectangles, not circles or pills. */
export const Squircle = { borderCurve: 'continuous' } as const;

/** Swatches a habit can be tinted with. */
export const HabitColors = {
  ember: '#FF9600',
  gold: '#F0B400',
  coral: '#FF6F5B',
  rose: '#FF5C8A',
  green: '#58CC02',
  mint: '#1FB98B',
  olive: '#8C9A2E',
  cocoa: '#A06A45',
} as const;

export type HabitColor = keyof typeof HabitColors;

/** Colors from earlier versions, mapped so saved habits keep a sensible tint. */
export const LEGACY_HABIT_COLORS: Record<string, HabitColor> = {
  violet: 'rose',
  blue: 'mint',
  teal: 'green',
  yellow: 'gold',
  orange: 'ember',
  red: 'coral',
  pink: 'rose',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 110 }) ?? 0;
export const MaxContentWidth = 560;
