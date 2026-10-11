import { type AndroidSymbol, type SFSymbol, SymbolView, type SymbolWeight } from 'expo-symbols';
import { Platform } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { type IconName, ICONS } from '@/constants/icons';

type IconProps = {
  ios: SFSymbol;
  md: AndroidSymbol;
  size?: number;
  color: string;
  weight?: SymbolWeight;
};

/** SF Symbol on iOS, Material Symbol on Android and web. */
export function Icon({ ios, md, size = 20, color, weight = 'bold' }: IconProps) {
  return (
    <SymbolView
      name={{ ios, android: md, web: md }}
      size={size}
      tintColor={color}
      weight={Platform.OS === 'ios' ? weight : undefined}
    />
  );
}

/** Icon from the app's registry (`src/constants/icons.ts`). */
export function Glyph({ name, size = 20, color, weight }: { name: IconName; size?: number; color: string; weight?: SymbolWeight }) {
  const icon = ICONS[name] ?? ICONS.star;
  return <Icon ios={icon.ios} md={icon.md} size={size} color={color} weight={weight} />;
}

export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={13} r={10} fill="#D99400" />
      <Circle cx={12} cy={11.5} r={10} fill="#FFC21A" />
      <Circle cx={12} cy={11.5} r={6.8} fill="none" stroke="#EDA700" strokeWidth={1.6} />
      <Path
        d="M12 7.4 Q12.7 10.8 16.1 11.5 Q12.7 12.2 12 15.6 Q11.3 12.2 7.9 11.5 Q11.3 10.8 12 7.4 Z"
        fill="#FFF4B8"
      />
      <Path d="M5.6 8.2 A7.6 7.6 0 0 1 9.4 4.6" stroke="#FFF4B8" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.8} />
    </Svg>
  );
}
