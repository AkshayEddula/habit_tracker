import { Colors } from '@/constants/theme';

/** The app ships a single light theme. */
export function useTheme() {
  return Colors.light;
}

export function useIsDark() {
  return false;
}
