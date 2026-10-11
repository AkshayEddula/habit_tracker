import { memo, type ReactNode, useId } from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Path,
} from 'react-native-svg';

import type { CritterSpec } from '@/data/creatures';
import { tint } from '@/lib/color';

const INK = '#2B211C';
const LINE = '#3B2A22';

/** Deterministic jitter for path coordinates, so every outline is a little uneven, like pen on paper. */
function wobble(d: string, seed: number, amount: number) {
  let s = seed % 2147483647 || 1;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => {
    s = (s * 16807) % 2147483647;
    return (parseFloat(n) + (s / 2147483647 - 0.5) * 2 * amount).toFixed(1);
  });
}

function hash(text: string) {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 2147483647;
  return h;
}
const MIRROR = 'translate(100, 0) scale(-1, 1)';
const LEAF = '#56C26A';

type Anchor = {
  d: string;
  /** y of the top of the head */
  top: number;
  eyeY: number;
  eyeDX: number;
  mouthY: number;
  /** half width of the body at `sideY` */
  hw: number;
  sideY: number;
  earX: number;
  earY: number;
  /** highlight position */
  hx: number;
  hy: number;
};

const BODIES: Record<CritterSpec['body'], Anchor> = {
  blob: {
    d: 'M50 30 C70 30 82 44 82 62 C82 79 68 88 50 88 C32 88 18 79 18 62 C18 44 30 30 50 30 Z',
    top: 30, eyeY: 57, eyeDX: 11, mouthY: 67, hw: 32, sideY: 64, earX: 17, earY: 38, hx: 35, hy: 41,
  },
  bean: {
    d: 'M50 22 C67 22 76 38 76 58 C76 78 66 90 50 90 C34 90 24 78 24 58 C24 38 33 22 50 22 Z',
    top: 22, eyeY: 50, eyeDX: 10, mouthY: 60, hw: 26, sideY: 62, earX: 13, earY: 31, hx: 37, hy: 34,
  },
  pear: {
    d: 'M50 30 C62 30 68 40 72 52 C78 68 78 88 50 88 C22 88 22 68 28 52 C32 40 38 30 50 30 Z',
    top: 30, eyeY: 53, eyeDX: 9, mouthY: 63, hw: 26, sideY: 68, earX: 11, earY: 37, hx: 40, hy: 41,
  },
  ghost: {
    d: 'M22 58 C22 40 34 28 50 28 C66 28 78 40 78 58 L78 84 C74 90 70 90 67 85 C64 80 60 80 58 85 C55 90 45 90 42 85 C40 80 36 80 33 85 C30 90 26 90 22 84 Z',
    top: 28, eyeY: 54, eyeDX: 11, mouthY: 64, hw: 28, sideY: 60, earX: 15, earY: 35, hx: 36, hy: 39,
  },
  drop: {
    d: 'M50 16 C56 30 80 44 80 64 C80 80 67 90 50 90 C33 90 20 80 20 64 C20 44 44 30 50 16 Z',
    top: 22, eyeY: 61, eyeDX: 11, mouthY: 71, hw: 30, sideY: 68, earX: 12, earY: 36, hx: 36, hy: 52,
  },
  chonk: {
    d: 'M50 38 C76 38 88 52 88 67 C88 82 73 89 50 89 C27 89 12 82 12 67 C12 52 24 38 50 38 Z',
    top: 38, eyeY: 61, eyeDX: 13, mouthY: 70, hw: 38, sideY: 70, earX: 21, earY: 45, hx: 31, hy: 50,
  },
};

type Props = {
  spec: CritterSpec;
  size: number;
  /** Render as a solid shape, used for undiscovered critters. */
  silhouette?: boolean;
  silhouetteColor?: string;
  /** Momentary expression, driven by the animated wrapper. */
  mood?: CritterMood;
  /** Draw a single layer, so an animated wrapper can move the layers independently. */
  part?: CritterPart | 'all';
};

export type CritterPart = 'ground' | 'footL' | 'footR' | 'back' | 'body' | 'face';

export type CritterMood = 'idle' | 'blink' | 'happy' | 'wink' | 'sleep';

export const Critter = memo(function Critter({
  spec,
  size,
  silhouette = false,
  silhouetteColor = '#3A2F27',
  mood = 'idle',
  part = 'all',
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const b = BODIES[spec.body];
  const sil = silhouette;
  const c = (color: string) => (sil ? silhouetteColor : color);
  const ink = sil ? silhouetteColor : LINE;
  const seed = hash(spec.color + spec.body + (spec.top ?? ''));
  // The drawn shape and a looser second pass of the pen over it.
  const bd = wobble(b.d, seed, 1.1);
  const sketch = wobble(b.d, seed + 99, 1.6);
  const T = b.top;

  const sym = (el: ReactNode) => (
    <>
      {el}
      <G transform={MIRROR}>{el}</G>
    </>
  );

  // ---- features drawn behind the body ----
  const back: ReactNode[] = [];
  const front: ReactNode[] = [];

  switch (spec.top) {
    case 'catEars': {
      const cx = 50 - b.earX;
      const by = b.earY;
      back.push(
        <G key="ears">
          {sym(
            <>
              <Path
                d={`M${cx - 9} ${by + 6} L${cx - 6} ${by - 17} L${cx + 9} ${by - 3} Z`}
                fill={c(spec.color)}
                stroke={ink}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path
                d={`M${cx - 5.5} ${by + 2} L${cx - 4.5} ${by - 10} L${cx + 4} ${by - 2} Z`}
                fill={c(spec.accent)}
                stroke={ink}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </>,
          )}
        </G>,
      );
      break;
    }
    case 'bearEars': {
      const cx = 50 - b.earX - 2;
      const cy = b.earY - 2;
      back.push(
        <G key="ears">
          {sym(
            <>
              <Circle cx={cx} cy={cy} r={9.5} fill={c(spec.color)} />
              <Circle cx={cx} cy={cy} r={5.2} fill={c(spec.accent)} />
            </>,
          )}
        </G>,
      );
      break;
    }
    case 'bow': {
      const bx = 63;
      const by = T + 5;
      front.push(
        <G key="bow">
          <Path d={`M${bx} ${by} L${bx - 11} ${by - 7} Q${bx - 13} ${by} ${bx - 11} ${by + 7} Z`} fill={c(spec.accent)} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <Path d={`M${bx} ${by} L${bx + 11} ${by - 7} Q${bx + 13} ${by} ${bx + 11} ${by + 7} Z`} fill={c(spec.accent)} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <Circle cx={bx} cy={by} r={3.4} fill={c(tint(spec.accent, -0.15))} />
        </G>,
      );
      break;
    }
    case 'bunnyEars': {
      const cx = 50 - b.earX * 0.7;
      const cy = b.earY - 13;
      back.push(
        <G key="ears">
          {sym(
            <G transform={`rotate(-12 ${cx} ${cy})`}>
              <Ellipse cx={cx} cy={cy} rx={6} ry={15} fill={c(spec.color)} />
              <Ellipse cx={cx} cy={cy + 1.5} rx={3} ry={10} fill={c(spec.accent)} />
            </G>,
          )}
        </G>,
      );
      break;
    }
    case 'horns': {
      const hx = 50 - b.earX + 2;
      const hy = b.earY - 2;
      back.push(
        <G key="horns">
          {sym(
            <Path
              d={`M${hx - 6} ${hy + 5} C${hx - 10} ${hy - 4} ${hx - 8} ${hy - 12} ${hx - 3} ${hy - 17} C${hx - 1} ${hy - 10} ${hx + 3} ${hy - 4} ${hx + 6} ${hy + 2} Z`}
              fill={c(spec.accent)}
              stroke={ink}
              strokeWidth={2}
              strokeLinejoin="round"
            />,
          )}
        </G>,
      );
      break;
    }
    case 'antlers': {
      const ax = 50 - b.earX + 4;
      const ay = b.earY;
      back.push(
        <G key="antlers">
          {sym(
            <Path
              d={`M${ax} ${ay} Q${ax - 3} ${ay - 10} ${ax - 8} ${ay - 18} M${ax - 3} ${ay - 9} Q${ax - 9} ${ay - 11} ${ax - 13} ${ay - 8} M${ax - 6} ${ay - 15} Q${ax - 3} ${ay - 20} ${ax - 1} ${ay - 24}`}
              stroke={c(spec.accent)}
              strokeWidth={3.6}
              strokeLinecap="round"
              fill="none"
            />,
          )}
        </G>,
      );
      break;
    }
    case 'leaf':
      back.push(
        <G key="leaf">
          <Path d={`M50 ${T + 4} Q49 ${T - 4} 51 ${T - 9}`} stroke={c('#3C9A4E')} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d={`M51 ${T - 8} C44 ${T - 18} 34 ${T - 16} 33 ${T - 9} C39 ${T - 4} 46 ${T - 4} 51 ${T - 8} Z`} fill={c(spec.accent)} />
          <Path d={`M51 ${T - 8} C56 ${T - 20} 68 ${T - 21} 70 ${T - 14} C65 ${T - 6} 57 ${T - 5} 51 ${T - 8} Z`} fill={c(tint(spec.accent, 0.12))} />
          {!sil && (
            <Path d={`M51 ${T - 8} Q60 ${T - 13} 67 ${T - 14} M51 ${T - 8} Q42 ${T - 11} 36 ${T - 10}`} stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          )}
        </G>,
      );
      break;
    case 'flame':
      back.push(
        <G key="flame">
          <Path d={`M50 ${T - 24} C58 ${T - 15} 64 ${T - 9} 61 ${T + 1} C58 ${T + 9} 42 ${T + 9} 39 ${T + 1} C37 ${T - 6} 42 ${T - 10} 45 ${T - 15} C46 ${T - 10} 48 ${T - 9} 50 ${T - 24} Z`} fill={c('#FF7A1A')} />
          <Path d={`M50 ${T - 17} C55 ${T - 10} 59 ${T - 6} 57 ${T + 1} C55 ${T + 7} 45 ${T + 7} 43 ${T + 1} C42 ${T - 4} 46 ${T - 8} 50 ${T - 17} Z`} fill={c('#FFAA2E')} />
          <Path d={`M50 ${T - 10} C53 ${T - 5} 56 ${T - 2} 54 ${T + 3} C52 ${T + 6} 48 ${T + 6} 46 ${T + 3} C45 ${T - 1} 48 ${T - 4} 50 ${T - 10} Z`} fill={c('#FFE066')} />
        </G>,
      );
      break;
    case 'antenna':
      back.push(
        <G key="antenna">
          {sym(
            <>
              <Path d={`M43 ${T + 4} Q40 ${T - 6} 36 ${T - 12}`} stroke={c(spec.shade)} strokeWidth={2.4} strokeLinecap="round" fill="none" />
              <Circle cx={36} cy={T - 13} r={3.8} fill={c(spec.accent)} />
              {!sil && <Circle cx={34.8} cy={T - 14.3} r={1.2} fill="rgba(255,255,255,0.7)" stroke="none" />}
            </>,
          )}
        </G>,
      );
      break;
    case 'droplet':
      back.push(
        <G key="droplet">
          <Path d={`M50 ${T - 18} C55 ${T - 10} 59 ${T - 6} 59 ${T} C59 ${T + 5} 55 ${T + 8} 50 ${T + 8} C45 ${T + 8} 41 ${T + 5} 41 ${T} C41 ${T - 6} 45 ${T - 10} 50 ${T - 18} Z`} fill={c(spec.accent)} />
          {!sil && <Ellipse cx={47} cy={T - 4} rx={1.8} ry={3} fill="rgba(255,255,255,0.75)" stroke="none" />}
        </G>,
      );
      break;
    case 'spikes': {
      const spikes = [-1, 0, 1].map((i) => {
        const x = 50 + i * b.hw * 0.42;
        const base = T + 6 + Math.abs(i) * 3;
        const tipY = base - (i === 0 ? 16 : 13);
        const tipX = x + i * 3;
        return (
          <Path
            key={i}
            d={`M${x - 6} ${base} L${tipX} ${tipY} L${x + 6} ${base} Z`}
            fill={c(spec.accent)}
            stroke={ink}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        );
      });
      back.push(<G key="spikes">{spikes}</G>);
      break;
    }
    case 'bolt':
      back.push(
        <Path
          key="bolt"
          d={`M53 ${T - 22} L41 ${T - 5} L49 ${T - 5} L45 ${T + 6} L60 ${T - 11} L52 ${T - 11} L56 ${T - 22} Z`}
          fill={c('#FFD21F')}
          stroke={ink}
          strokeWidth={2}
          strokeLinejoin="round"
        />,
      );
      break;
    case 'crown':
      front.push(
        <G key="crown">
          <Path
            d={`M39 ${T + 3} L38 ${T - 10} L44.5 ${T - 4} L50 ${T - 14} L55.5 ${T - 4} L62 ${T - 10} L61 ${T + 3} Z`}
            fill={c('#FFC62E')}
            stroke={ink}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {!sil && (
            <>
              <Circle cx={50} cy={T - 1} r={2.1} fill="#FF5C8A" />
              <Circle cx={43.5} cy={T} r={1.4} fill="#5CC8FF" />
              <Circle cx={56.5} cy={T} r={1.4} fill="#5CC8FF" />
              <Circle cx={38} cy={T - 10} r={1.6} fill="#FFE27A" />
              <Circle cx={50} cy={T - 14} r={1.6} fill="#FFE27A" />
              <Circle cx={62} cy={T - 10} r={1.6} fill="#FFE27A" />
            </>
          )}
        </G>,
      );
      break;
    case 'halo':
      front.push(
        <Ellipse key="halo" cx={50} cy={T - 9} rx={14} ry={3.8} fill="none" stroke={c('#FFD447')} strokeWidth={3} />,
      );
      break;
    case 'mushroom': {
      const w = b.hw + 4;
      front.push(
        <G key="cap">
          <Path
            d={`M${50 - w} ${T + 14} C${50 - w} ${T - 14} ${50 + w} ${T - 14} ${50 + w} ${T + 14} Q50 ${T + 8} ${50 - w} ${T + 14} Z`}
            fill={c(spec.accent)}
          />
          {!sil && (
            <>
              <Circle cx={36} cy={T + 2} r={4} fill="#FFF6EC" stroke="none" />
              <Circle cx={55} cy={T - 3} r={3.4} fill="#FFF6EC" stroke="none" />
              <Circle cx={69} cy={T + 6} r={3} fill="#FFF6EC" stroke="none" />
              <Circle cx={24} cy={T + 10} r={2.2} fill="#FFF6EC" stroke="none" />
              <Path d={`M${50 - w + 6} ${T + 4} Q${50 - w + 10} ${T - 6} ${50 - 8} ${T - 8}`} stroke="rgba(255,255,255,0.4)" strokeWidth={2.4} strokeLinecap="round" fill="none" />
            </>
          )}
        </G>,
      );
      break;
    }
    case 'flower': {
      const fx = 59;
      const fy = T + 1;
      const petals = Array.from({ length: 5 }, (_, i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return <Circle key={i} cx={fx + Math.cos(a) * 4.8} cy={fy + Math.sin(a) * 4.8} r={4.3} fill={c(spec.accent)} />;
      });
      front.push(
        <G key="flower">
          <Path d={`M54 ${T + 3} C50 ${T - 3} 44 ${T - 3} 42 ${T + 1} C46 ${T + 5} 50 ${T + 5} 54 ${T + 3} Z`} fill={c(LEAF)} />
          {petals}
          <Circle cx={fx} cy={fy} r={3} fill={c('#FFD447')} />
        </G>,
      );
      break;
    }
    case 'tuft':
      front.push(
        <Path
          key="tuft"
          d={`M47 ${T + 3} C44 ${T - 6} 50 ${T - 11} 55 ${T - 8} C51 ${T - 6} 50 ${T - 2} 52 ${T + 3} Z`}
          fill={c(spec.shade)}
        />,
      );
      break;
  }

  // ---- sides ----
  const wingColor = spec.wing ?? spec.accent;
  switch (spec.sides) {
    case 'wings': {
      const x = 50 - b.hw + 6;
      const y = b.sideY - 8;
      back.push(
        <G key="wings">
          {sym(
            <Path
              d={`M${x} ${y} C${x - 12} ${y - 16} ${x - 24} ${y - 10} ${x - 22} ${y + 2} C${x - 18} ${y} ${x - 16} ${y + 4} ${x - 14} ${y + 8} C${x - 10} ${y + 6} ${x - 6} ${y + 8} ${x + 2} ${y + 10} Z`}
              fill={c(wingColor)}
              stroke={ink}
              strokeWidth={2}
              strokeLinejoin="round"
            />,
          )}
        </G>,
      );
      break;
    }
    case 'bugWings': {
      const cx = 50 - b.hw - 1;
      const cy = b.sideY - 18;
      back.push(
        <G key="bug">
          {sym(
            <G transform={`rotate(-32 ${cx} ${cy})`}>
              <Ellipse
                cx={cx}
                cy={cy}
                rx={9}
                ry={14}
                fill={sil ? silhouetteColor : 'rgba(255,255,255,0.78)'}
                stroke={ink}
                strokeWidth={2}
              />
            </G>,
          )}
        </G>,
      );
      break;
    }
    case 'fins': {
      const x = 50 - b.hw + 2;
      const y = b.sideY;
      back.push(
        <G key="fins">
          {sym(
            <Path
              d={`M${x + 2} ${y - 6} Q${x - 10} ${y - 4} ${x - 12} ${y + 6} Q${x - 4} ${y + 8} ${x + 2} ${y + 8} Z`}
              fill={c(spec.accent)}
              stroke={ink}
              strokeWidth={2}
              strokeLinejoin="round"
            />,
          )}
        </G>,
      );
      break;
    }
    case 'leafArms': {
      const x = 50 - b.hw + 4;
      const y = b.sideY + 2;
      back.push(
        <G key="leafArms">
          {sym(
            <Path
              d={`M${x} ${y} C${x - 6} ${y - 10} ${x - 18} ${y - 8} ${x - 20} ${y - 2} C${x - 14} ${y + 6} ${x - 4} ${y + 6} ${x} ${y} Z`}
              fill={c(LEAF)}
            />,
          )}
        </G>,
      );
      break;
    }
    case 'arms': {
      const cx = 50 - b.hw + 4;
      const cy = b.sideY + 7;
      front.push(
        <G key="arms">
          {sym(
            <Ellipse
              cx={cx}
              cy={cy}
              rx={5.2}
              ry={7}
              transform={`rotate(28 ${cx} ${cy})`}
              fill={c(spec.color)}
              stroke={ink}
              strokeWidth={2}
            />,
          )}
        </G>,
      );
      break;
    }
  }

  // ---- tail (right side, behind) ----
  if (spec.tail) {
    const x = 50 + b.hw - 7;
    const y = b.sideY + 14;
    if (spec.tail === 'flame') {
      const fx = x + 14;
      const fy = y - 14;
      back.push(
        <G key="tail">
          <Path d={`M${x} ${y} Q${x + 14} ${y + 2} ${x + 14} ${y - 10}`} stroke={c(spec.color)} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d={`M${fx} ${fy - 11} C${fx + 5} ${fy - 6} ${fx + 7} ${fy - 2} ${fx + 5} ${fy + 3} C${fx + 3} ${fy + 7} ${fx - 3} ${fy + 7} ${fx - 5} ${fy + 3} C${fx - 7} ${fy - 1} ${fx - 3} ${fy - 5} ${fx} ${fy - 11} Z`} fill={c('#FF7A1A')} />
          <Path d={`M${fx} ${fy - 5} C${fx + 3} ${fy - 2} ${fx + 4} ${fy + 1} ${fx + 2.5} ${fy + 3.5} C${fx + 1} ${fy + 5} ${fx - 1} ${fy + 5} ${fx - 2.5} ${fy + 3.5} C${fx - 4} ${fy + 1} ${fx - 2} ${fy - 2} ${fx} ${fy - 5} Z`} fill={c('#FFE066')} />
        </G>,
      );
    } else if (spec.tail === 'bolt') {
      back.push(
        <G key="tail">
          <Path d={`M${x - 4} ${y + 2} Q${x + 4} ${y + 2} ${x + 8} ${y - 4}`} stroke={c(spec.color)} strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path
            d={`M${x + 12} ${y - 24} L${x + 4} ${y - 9} L${x + 10} ${y - 9} L${x + 6} ${y + 1} L${x + 19} ${y - 13} L${x + 12} ${y - 13} L${x + 17} ${y - 24} Z`}
            fill={c('#FFD21F')}
            stroke={ink}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </G>,
      );
    } else if (spec.tail === 'round') {
      back.push(<Circle key="tail" cx={50 + b.hw - 1} cy={b.sideY + 12} r={7} fill={c(spec.belly ?? '#FFFFFF')} />);
    } else if (spec.tail === 'leaf') {
      back.push(
        <Path
          key="tail"
          d={`M${x} ${y} C${x + 6} ${y - 14} ${x + 20} ${y - 14} ${x + 22} ${y - 8} C${x + 16} ${y + 2} ${x + 6} ${y + 4} ${x} ${y} Z`}
          fill={c(LEAF)}
        />,
      );
    }
  }

  // ---- markings clipped to the body ----
  const markings: ReactNode[] = [];
  if (!sil) {
    // Flat two-tone shading: a darker crescent along the lower right.
    markings.push(
      <G key="shade" stroke={spec.shade} strokeWidth={2.6} strokeLinecap="round" opacity={0.6}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Path key={k} d={`M${50 + b.hw * 0.1 + k * 6.5} ${b.sideY + 24 - (k % 2)} l${9 + (k % 3)} ${-13 - (k % 2) * 2}`} />
        ))}
      </G>,
    );
    if (spec.pattern === 'belly') {
      markings.push(<Ellipse key="belly" cx={50} cy={b.mouthY + 15} rx={b.hw * 0.62} ry={14} fill={spec.belly ?? '#FFFFFF'} />);
    } else if (spec.pattern === 'spots') {
      const spots: [number, number, number][] = [
        [50 - b.hw * 0.62, b.eyeY - 12, 4],
        [50 + b.hw * 0.55, b.eyeY - 15, 3],
        [50 - b.hw * 0.78, b.mouthY + 8, 3.2],
        [50 + b.hw * 0.72, b.mouthY + 6, 4.5],
        [50 + b.hw * 0.2, b.mouthY + 16, 2.6],
      ];
      spots.forEach(([cx, cy, r], i) =>
        markings.push(<Circle key={`s${i}`} cx={cx} cy={cy} r={r} fill={spec.accent} opacity={0.5} />),
      );
    } else if (spec.pattern === 'bands') {
      markings.push(
        <G key="bands" fill={spec.accent} opacity={0.9}>
          <Path d={`M10 ${b.mouthY + 7} Q50 ${b.mouthY + 12} 90 ${b.mouthY + 7} L90 ${b.mouthY + 12} Q50 ${b.mouthY + 17} 10 ${b.mouthY + 12} Z`} />
          <Path d={`M10 ${b.mouthY + 18} Q50 ${b.mouthY + 23} 90 ${b.mouthY + 18} L90 ${b.mouthY + 23} Q50 ${b.mouthY + 28} 10 ${b.mouthY + 23} Z`} />
        </G>,
      );
    } else if (spec.pattern === 'marks') {
      markings.push(
        <G key="marks" stroke={spec.shade} strokeWidth={3.4} strokeLinecap="round">
          <Path d={`M44 ${T - 1} L44.5 ${T + 7}`} />
          <Path d={`M50 ${T - 1} L50 ${T + 9}`} />
          <Path d={`M56 ${T - 1} L55.5 ${T + 7}`} />
        </G>,
      );
    }
    markings.push(
      <G key="hl">
        <Path
          d={`M${b.hx - 6} ${b.hy + 4} Q${b.hx - 3} ${b.hy - 4} ${b.hx + 5} ${b.hy - 6}`}
          stroke="#FFFFFF"
          strokeOpacity={0.7}
          strokeWidth={3.2}
          strokeLinecap="round"
          fill="none"
        />
        <Path d={`M${b.hx + 9} ${b.hy - 7} l2.5 -0.8`} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" />
      </G>,
    );
  }

  const show = (p: CritterPart) => part === 'all' || part === p;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={`clip${uid}`}>
          <Path d={bd} />
        </ClipPath>
      </Defs>

      {show('ground') && (
        <>
          {!sil && (
            <Path
              d="M27 93 Q50 96.5 73 92.5 M33 95.5 Q50 98 67 95"
              stroke="#2B1D12"
              strokeOpacity={0.16}
              strokeWidth={2.4}
              strokeLinecap="round"
              fill="none"
            />
          )}
          {spec.aura && !sil && <Aura />}
        </>
      )}
      {show('footL') && spec.body !== 'ghost' && (
        <Ellipse cx={41} cy={89} rx={6.5} ry={3.4} fill={c(spec.shade)} stroke={ink} strokeWidth={sil ? 0 : 1.8} />
      )}
      {show('footR') && spec.body !== 'ghost' && (
        <Ellipse cx={59.6} cy={89.3} rx={6.3} ry={3.5} fill={c(spec.shade)} stroke={ink} strokeWidth={sil ? 0 : 1.8} />
      )}
      {show('back') && (
        <G stroke={ink} strokeWidth={sil ? 0 : 2} strokeLinejoin="round" strokeLinecap="round">
          {back}
        </G>
      )}
      {show('body') && (
        <>
          {/* Color sits slightly off the line work, like a print that's a hair out of register. */}
          <G transform={sil ? undefined : 'translate(1.1 0.9)'}>
            <Path d={bd} fill={sil ? silhouetteColor : spec.color} />
            {!sil && <G clipPath={`url(#clip${uid})`}>{markings}</G>}
          </G>
          {!sil && (
            <>
              <Path d={bd} fill="none" stroke={LINE} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
              <Path d={sketch} fill="none" stroke={LINE} strokeOpacity={0.4} strokeWidth={0.9} strokeLinejoin="round" />
            </>
          )}
          <G stroke={ink} strokeWidth={sil ? 0 : 2} strokeLinejoin="round" strokeLinecap="round">
            {front}
          </G>
        </>
      )}
      {show('face') && !sil && <Face spec={spec} b={b} mood={mood} />}
    </Svg>
  );
});

function Face({ spec, b, mood }: { spec: CritterSpec; b: Anchor; mood: CritterMood }) {
  // Eyes sit a touch lower and wider than the anatomical anchor: a bigger forehead reads as cuter.
  const eyeY = b.eyeY + 1.5;
  const eyeDX = b.eyeDX + 1;
  const m = b.mouthY;
  const cyclops = spec.eyes === 'cyclops' && mood === 'idle';
  const cheekDX = spec.eyes === 'cyclops' ? 15 : eyeDX + 7;
  const eyes = mood === 'happy' ? 'happy' : mood === 'blink' || mood === 'sleep' ? 'sleepy' : spec.eyes;
  const mouthKind = mood === 'happy' || mood === 'wink' ? 'open' : mood === 'sleep' ? 'o' : spec.mouth;

  const eye = (x: number) => {
    // A wink closes just the left eye into a happy arc.
    switch (mood === 'wink' && x < 50 ? 'happy' : eyes) {
      case 'happy':
        return <Path d={`M${x - 4.5} ${eyeY + 1.5} Q${x} ${eyeY - 4.5} ${x + 4.5} ${eyeY + 1.5}`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
      case 'sleepy':
        return <Path d={`M${x - 4.5} ${eyeY - 0.5} Q${x} ${eyeY + 3.5} ${x + 4.5} ${eyeY - 0.5}`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
      case 'sparkle':
        return (
          <>
            <Ellipse cx={x} cy={eyeY} rx={5.8} ry={7} fill={INK} />
            <Ellipse cx={x} cy={eyeY + 3} rx={3.8} ry={2.7} fill="#A0683F" />
            <Circle cx={x - 1.9} cy={eyeY - 2.6} r={2.7} fill="#FFFFFF" />
            <Circle cx={x + 2.2} cy={eyeY + 1.6} r={1.2} fill="#FFFFFF" />
            <Circle cx={x + 2.2} cy={eyeY - 2.8} r={0.7} fill="#FFFFFF" />
          </>
        );
      case 'fierce': {
        const inward = x < 50 ? 1 : -1;
        return (
          <>
            <Ellipse cx={x} cy={eyeY + 0.5} rx={4} ry={4.6} fill={INK} />
            <Circle cx={x - 1.3} cy={eyeY - 1.2} r={1.5} fill="#FFFFFF" />
            <Path d={`M${x - inward * 5} ${eyeY - 8} L${x + inward * 4} ${eyeY - 5.5}`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
          </>
        );
      }
      default:
        return (
          <>
            <Ellipse cx={x} cy={eyeY} rx={5.2} ry={6.4} fill={INK} />
            <Ellipse cx={x} cy={eyeY + 2.8} rx={3.3} ry={2.4} fill="#8A5A3C" />
            <Circle cx={x - 1.7} cy={eyeY - 2.4} r={2.3} fill="#FFFFFF" />
            <Circle cx={x + 2} cy={eyeY + 1.6} r={1} fill="#FFFFFF" />
          </>
        );
    }
  };

  let mouth: ReactNode;
  switch (mouthKind) {
    case 'open':
      mouth = (
        <>
          <Path d={`M45.5 ${m - 1} Q50 ${m + 8} 54.5 ${m - 1} Z`} fill="#3A2420" />
          <Ellipse cx={50} cy={m + 2.4} rx={2.4} ry={1.2} fill="#FF7A93" />
        </>
      );
      break;
    case 'cat':
      mouth = <Path d={`M45 ${m} Q47.5 ${m + 3} 50 ${m} Q52.5 ${m + 3} 55 ${m}`} stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
      break;
    case 'fang':
      mouth = (
        <>
          <Path d={`M45.5 ${m} Q50 ${m + 4} 54.5 ${m}`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" />
          <Path d={`M47.2 ${m + 1.4} L48.4 ${m + 4.4} L49.6 ${m + 1.9} Z`} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={0.6} strokeLinejoin="round" />
        </>
      );
      break;
    case 'beak':
      mouth = (
        <Path
          d={`M46 ${m - 1} L54 ${m - 1} L50 ${m + 4.5} Z`}
          fill="#FF9F1C"
          stroke="#FF9F1C"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
      break;
    case 'o':
      mouth = <Ellipse cx={50} cy={m + 1} rx={2.2} ry={2.7} fill="#3A2420" />;
      break;
    case 'tongue':
      mouth = (
        <>
          <Ellipse cx={51.5} cy={m + 2.6} rx={2.1} ry={2.7} fill="#FF7A93" />
          <Path d={`M45.5 ${m} Q50 ${m + 4} 54.5 ${m}`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </>
      );
      break;
    default:
      mouth = <Path d={`M46 ${m} Q50 ${m + 4} 54 ${m}`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" />;
  }

  return (
    <G>
      {/* Blush drawn as quick pencil strokes rather than perfect ovals. */}
      <G stroke="#FF6F91" strokeWidth={1.7} strokeLinecap="round" opacity={0.85}>
        {[-1, 1].map((side) =>
          [-1, 0, 1].map((i) => (
            <Path key={`${side}${i}`} d={`M${50 + side * cheekDX + i * 2.7 - 1.2} ${eyeY + 9.2} l2.5 -4.6`} />
          )),
        )}
      </G>
      {cyclops ? (
        <>
          <Circle cx={50} cy={eyeY - 1} r={9.5} fill="#FFFFFF" />
          <Circle cx={50} cy={eyeY - 0.5} r={6} fill={spec.accent} />
          <Circle cx={50} cy={eyeY - 0.5} r={3.2} fill={INK} />
          <Circle cx={47.6} cy={eyeY - 3.6} r={2} fill="#FFFFFF" />
        </>
      ) : (
        <>
          {eye(50 - eyeDX)}
          {eye(50 + eyeDX)}
        </>
      )}
      {mouth}
    </G>
  );
}

function star(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
}

function Aura() {
  return (
    <G fill="#FFE27A">
      <Path d={star(12, 30, 5)} />
      <Path d={star(88, 24, 4)} />
      <Path d={star(91, 64, 3.2)} opacity={0.85} />
      <Path d={star(9, 70, 3)} opacity={0.85} />
    </G>
  );
}
