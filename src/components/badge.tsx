import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Glyph } from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import type { BadgeShape, BadgeTone } from '@/store/game';

const TONES: Record<BadgeTone | 'locked', { face: string; edge: string; inner: string; ribbon: string; ribbonEdge: string }> = {
  gold: { face: '#FFC800', edge: '#D99A00', inner: '#FFDE59', ribbon: '#FF4B4B', ribbonEdge: '#D93636' },
  orange: { face: '#FF9600', edge: '#D97700', inner: '#FFB84D', ribbon: '#FFC800', ribbonEdge: '#E0A800' },
  green: { face: '#58CC02', edge: '#46A302', inner: '#8AE04A', ribbon: '#FFC800', ribbonEdge: '#E0A800' },
  rose: { face: '#FF5C8A', edge: '#D93D6B', inner: '#FF94B2', ribbon: '#FFC800', ribbonEdge: '#E0A800' },
  mint: { face: '#1FB98B', edge: '#14936D', inner: '#5FD6B1', ribbon: '#FF9600', ribbonEdge: '#D97700' },
  locked: { face: '#E5E5E5', edge: '#CFCFCF', inner: '#F1F1F1', ribbon: '#E5E5E5', ribbonEdge: '#CFCFCF' },
};

function rosette() {
  const pts: string[] = [];
  const bumps = 12;
  for (let i = 0; i < bumps * 2; i++) {
    const a = (i / (bumps * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 42 : 36.5;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)} ${(46 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function burst() {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 43 : 33;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)} ${(46 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

const SHAPES: Record<BadgeShape, string> = {
  rosette: rosette(),
  burst: burst(),
  shield: 'M50 5 L87 16 V48 C87 70 70 84 50 91 C30 84 13 70 13 48 V16 Z',
  hex: 'M50 4 L87 25 V67 L50 88 L13 67 V25 Z',
};

/** A medal: ribbon tails, a chunky shaped body with a lighter inner plate, and an icon. Grey when locked. */
export function Badge({
  shape,
  tone,
  icon,
  size,
  locked = false,
}: {
  shape: BadgeShape;
  tone: BadgeTone;
  icon: IconName;
  size: number;
  locked?: boolean;
}) {
  const c = TONES[locked ? 'locked' : tone];
  const d = SHAPES[shape];
  const iconSize = size * 0.34;

  return (
    <View style={{ width: size, height: size * 1.12, alignItems: 'center' }}>
      <Svg width={size} height={size * 1.12} viewBox="0 0 100 112">
        {/* ribbon tails */}
        <Path d="M33 70 L24 108 L36 100 L45 109 L50 80 Z" fill={c.ribbonEdge} />
        <Path d="M67 70 L76 108 L64 100 L55 109 L50 80 Z" fill={c.ribbon} />
        {/* body with a chunky bottom edge */}
        <G stroke={c.edge} strokeWidth={5} strokeLinejoin="round" fill={c.edge}>
          <Path d={d} transform="translate(0 5)" />
        </G>
        <G stroke={c.face} strokeWidth={5} strokeLinejoin="round" fill={c.face}>
          <Path d={d} />
        </G>
        {/* inner plate */}
        <Circle cx={50} cy={46} r={27} fill={c.inner} />
        <Circle cx={50} cy={46} r={27} fill="none" stroke={c.edge} strokeOpacity={0.35} strokeWidth={2} />
        {/* shine */}
        {!locked && (
          <>
            <Path d="M28 40 A24 24 0 0 1 44 24" stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={4} strokeLinecap="round" fill="none" />
            <Circle cx={26} cy={48} r={2.2} fill="#FFFFFF" opacity={0.75} />
          </>
        )}
      </Svg>
      <View style={{ position: 'absolute', top: size * 0.46 - iconSize / 2, alignItems: 'center' }}>
        <Glyph name={locked ? 'lock' : icon} size={iconSize} color={locked ? '#AFAFAF' : '#FFFFFF'} />
      </View>
    </View>
  );
}
