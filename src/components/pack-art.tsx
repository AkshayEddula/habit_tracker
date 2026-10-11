import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { HoloShimmer } from '@/components/holo';
import { Font } from '@/constants/theme';
import { tint } from '@/lib/color';
import { PACK_INFO, type PackKind } from '@/store/game';

function sparkle(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
}

/** A foil booster pack with crimped edges. */
export function PackArt({ width, kind, shimmer = true }: { width: number; kind: PackKind; shimmer?: boolean }) {
  const info = PACK_INFO[kind];
  const height = width * 1.45;
  const s = width / 160;
  const [a, b] = info.colors;
  const foil = info.foil;
  const ridges = Array.from({ length: 23 }, (_, i) => 6 + i * 4);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 100 145" style={StyleSheet.absoluteFill}>
        <Rect x={4} y={7} width={92} height={131} rx={6} fill={a} />
        <Path d="M50 7 L96 7 L96 138 L62 138 Z" fill={b} opacity={0.35} />
        {/* crimped foil seals */}
        <Rect x={2.5} y={1.5} width={95} height={10} rx={2.5} fill={tint(a, -0.22)} />
        <Rect x={2.5} y={133.5} width={95} height={10} rx={2.5} fill={tint(b, -0.22)} />
        <G stroke={foil} strokeOpacity={0.3} strokeWidth={1.1}>
          {ridges.map((x) => (
            <Path key={`t${x}`} d={`M${x} 3 L${x} 10`} />
          ))}
          {ridges.map((x) => (
            <Path key={`b${x}`} d={`M${x} 135 L${x} 142`} />
          ))}
        </G>
        {/* glossy diagonal */}
        <Path d="M4 70 L96 34 L96 50 L4 86 Z" fill={foil} opacity={0.12} />
        <Path d="M4 92 L96 56 L96 60 L4 96 Z" fill={foil} opacity={0.1} />
        {/* emblem */}
        <Circle cx={50} cy={62} r={25} fill={foil} opacity={0.18} />
        <Circle cx={50} cy={62} r={25} fill="none" stroke={foil} strokeOpacity={0.65} strokeWidth={1.8} />
        <Path d={sparkle(50, 62, 16)} fill={foil} />
        <Path d={sparkle(76, 30, 5)} fill={foil} opacity={0.9} />
        <Path d={sparkle(22, 40, 3.5)} fill={foil} opacity={0.75} />
        <Path d={sparkle(80, 96, 3)} fill={foil} opacity={0.7} />
      </Svg>
      <View style={[styles.label, { bottom: height * 0.17 }]}>
        <Text allowFontScaling={false} style={{ fontFamily: Font.black, fontSize: 15 * s, letterSpacing: 2 * s, color: foil }}>
          {info.title.toUpperCase()}
        </Text>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: Font.heavy, fontSize: 9 * s, letterSpacing: 2.4 * s, color: foil, opacity: 0.8 }}>
          HABITLINGS
        </Text>
      </View>
      {shimmer && (
        <View style={[StyleSheet.absoluteFill, { top: height * 0.05, bottom: height * 0.05, left: width * 0.04, right: width * 0.04, borderRadius: 6 * s, overflow: 'hidden' }]}>
          <HoloShimmer width={width * 0.92} height={height * 0.9} delay={1200} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 2 },
});
