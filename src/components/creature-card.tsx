import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Critter } from '@/components/critter';
import { HoloShimmer, Rays } from '@/components/holo';
import { Glyph } from '@/components/ui/icon';
import { Font, Squircle } from '@/constants/theme';
import { CREATURES, type Creature, ELEMENTS, formatNo, RARITIES } from '@/data/creatures';
import { alpha } from '@/lib/color';
import { cardLevel, type OwnedCard } from '@/store/game';

const INK = '#3C3C3C';
const MUTED = '#8A8A8A';
const PAPER = '#FFFFFF';
const VOID = '#F7F7F7';
const VOID_ART = '#EDEDED';
const VOID_FRAME = '#DDDDDD';
const VOID_TEXT = '#AFAFAF';
const SILHOUETTE = '#CDCDCD';
const TOTAL = String(CREATURES.length).padStart(3, '0');

export const CARD_RATIO = 88 / 63;

type CardProps = {
  creature: Creature;
  width: number;
  count?: number;
  silhouette?: boolean;
  shimmer?: boolean;
};

/** Full trading card, used on the detail screen and the pack reveal. */
export function CreatureCard({ creature, width, count = 1, silhouette = false, shimmer = true }: CardProps) {
  const s = width / 240;
  const height = width * CARD_RATIO;
  const rarity = RARITIES[creature.rarity];
  const el = ELEMENTS[creature.element];
  const level = cardLevel(count);
  const power = creature.power + (level - 1) * 10;
  const innerW = width - 28 * s;
  const artH = innerW * 0.78;
  const fancy = creature.rarity === 'epic' || creature.rarity === 'legendary';
  const frame = silhouette ? VOID_FRAME : rarity.color;

  return (
    <View style={[styles.cardShadow, { width, height, borderRadius: 16 * s }]}>
      <View
        style={{
          flex: 1,
          borderRadius: 16 * s,
          ...Squircle,
          padding: 6 * s,
          paddingBottom: 9 * s,
          overflow: 'hidden',
          backgroundColor: frame,
        }}>
        <View
          style={{
            flex: 1,
            borderRadius: 11 * s,
            ...Squircle,
            backgroundColor: silhouette ? VOID : PAPER,
            padding: 8 * s,
            gap: 6 * s,
          }}>
          <View style={styles.row}>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{ flex: 1, fontFamily: Font.black, fontSize: 18 * s, color: silhouette ? VOID_TEXT : INK }}>
              {silhouette ? '???' : creature.name}
            </Text>
            <View style={[styles.row, { gap: 4 * s }]}>
              <Text allowFontScaling={false} style={{ fontFamily: Font.heavy, fontSize: 9 * s, color: MUTED }}>
                PWR
              </Text>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: Font.black, fontSize: 18 * s, color: silhouette ? VOID_TEXT : INK }}>
                {silhouette ? '??' : power}
              </Text>
              <View
                style={{
                  width: 24 * s,
                  height: 24 * s,
                  borderRadius: 12 * s,
                  backgroundColor: silhouette ? '#E4E4E4' : el.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Glyph name={silhouette ? 'question' : el.icon} size={13 * s} color={silhouette ? VOID_TEXT : '#FFFFFF'} />
              </View>
            </View>
          </View>

          <View
            style={{
              height: artH,
              borderRadius: 9 * s,
              ...Squircle,
              backgroundColor: silhouette ? VOID_ART : el.art[0],
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            {fancy && !silhouette && (
              <View style={styles.center}>
                <Rays size={artH * 1.7} color={el.art[1]} opacity={0.9} />
              </View>
            )}
            {/* Wrapped so it stacks above the absolutely positioned rays on web. */}
            <View>
              <Critter spec={creature.spec} size={artH * 0.96} silhouette={silhouette} silhouetteColor={SILHOUETTE} />
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3 * s,
                height: 20 * s,
                paddingHorizontal: 8 * s,
                borderRadius: 10 * s,
                backgroundColor: silhouette ? '#EDEDED' : alpha(rarity.color, 0.14),
              }}>
              {!silhouette && <Stars count={rarity.stars} size={9 * s} color={rarity.color} />}
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: Font.black,
                  fontSize: 10 * s,
                  color: silhouette ? VOID_TEXT : rarity.color,
                  letterSpacing: 0.6 * s,
                }}>
                {silhouette ? 'UNDISCOVERED' : rarity.label.toUpperCase()}
              </Text>
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: Font.heavy, fontSize: 10 * s, color: MUTED }}>
              {silhouette ? '' : `${el.label} type`}
            </Text>
          </View>

          <Text
            allowFontScaling={false}
            numberOfLines={3}
            style={{
              fontFamily: Font.semibold,
              fontSize: 11.5 * s,
              lineHeight: 15.5 * s,
              color: silhouette ? VOID_TEXT : MUTED,
            }}>
            {silhouette ? 'Not discovered yet. Earn packs with perfect days to find it.' : creature.flavor}
          </Text>

          <View style={{ flex: 1 }} />
          <View style={styles.row}>
            <Text allowFontScaling={false} style={{ fontFamily: Font.heavy, fontSize: 10 * s, color: '#AFAFAF' }}>
              {formatNo(creature.no)} / {TOTAL}
            </Text>
            {!silhouette && (
              <Text allowFontScaling={false} style={{ fontFamily: Font.black, fontSize: 10 * s, color: rarity.color }}>
                LV {level}
              </Text>
            )}
          </View>
        </View>
        {shimmer && !silhouette && creature.rarity !== 'common' && <HoloShimmer width={width} height={height} />}
      </View>
    </View>
  );
}

type TileProps = { creature: Creature; width: number; owned?: OwnedCard };

/** Compact card for the collection grid. Undiscovered critters render as silhouettes. */
export function CreatureTile({ creature, width, owned }: TileProps) {
  const s = width / 110;
  const height = width * 1.34;
  const found = !!owned;
  const rarity = RARITIES[creature.rarity];
  const el = ELEMENTS[creature.element];
  const artH = width * 0.86;

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 16 * s,
        ...Squircle,
        backgroundColor: found ? rarity.color : VOID_FRAME,
        padding: 3 * s,
        paddingBottom: 6 * s,
        overflow: 'hidden',
      }}>
      <View
        style={{
          flex: 1,
          borderRadius: 13 * s,
          ...Squircle,
          backgroundColor: found ? PAPER : VOID,
          overflow: 'hidden',
        }}>
        <View
          style={{
            height: artH,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: found ? el.art[0] : VOID_ART,
          }}>
          <Critter spec={creature.spec} size={artH * 0.92} silhouette={!found} silhouetteColor={SILHOUETTE} />
          {found && owned.count > 1 && (
            <View
              style={[
                styles.countBadge,
                { top: 5 * s, right: 5 * s, paddingHorizontal: 6 * s, height: 18 * s, borderRadius: 9 * s },
              ]}>
              <Text allowFontScaling={false} style={{ fontFamily: Font.black, fontSize: 10 * s, color: '#FFFFFF' }}>
                ×{owned.count}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 * s }}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{ fontFamily: Font.black, fontSize: 13 * s, color: found ? INK : VOID_TEXT }}>
            {found ? creature.name : '???'}
          </Text>
          {found ? (
            <Stars count={rarity.stars} size={9.5 * s} color={rarity.color} />
          ) : (
            <Text
              allowFontScaling={false}
              style={{ fontFamily: Font.black, fontSize: 9.5 * s, color: VOID_TEXT, letterSpacing: 0.5 }}>
              {formatNo(creature.no)}
            </Text>
          )}
        </View>
      </View>
      {found && (creature.rarity === 'epic' || creature.rarity === 'legendary') && (
        <HoloShimmer width={width} height={height} delay={2600} />
      )}
    </View>
  );
}

function Stars({ count, size, color }: { count: number; size: number; color: string }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: count }, (_, i) => (
        <Glyph key={i} name="star" size={size} color={color} />
      ))}
    </View>
  );
}

function sparkle(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
}

export function BrandMark({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={46} fill={color} opacity={0.18} />
      <Circle cx={50} cy={50} r={46} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={4} />
      <Path d={sparkle(50, 50, 30)} fill={color} />
      <Path d={sparkle(73, 28, 8)} fill={color} opacity={0.85} />
      <Path d={sparkle(28, 72, 6)} fill={color} opacity={0.7} />
    </Svg>
  );
}

/** The face-down side of a card, shown before the flip on a pack reveal. */
export function CardBack({ width }: { width: number }) {
  const s = width / 240;
  return (
    <View style={[styles.cardShadow, { width, height: width * CARD_RATIO, borderRadius: 16 * s }]}>
      <View
        style={{
          flex: 1,
          borderRadius: 16 * s,
          ...Squircle,
          backgroundColor: '#FF9600',
          padding: 9 * s,
          paddingBottom: 13 * s,
        }}>
        <View
          style={{
            flex: 1,
            borderRadius: 11 * s,
            ...Squircle,
            backgroundColor: '#FFAA2B',
            borderWidth: 2.5 * s,
            borderColor: 'rgba(255,255,255,0.75)',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16 * s,
          }}>
          <BrandMark size={116 * s} />
          <Text
            allowFontScaling={false}
            style={{ fontFamily: Font.black, fontSize: 19 * s, letterSpacing: 4 * s, color: '#FFFFFF' }}>
            HABITLINGS
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  cardShadow: { boxShadow: '0 10px 24px rgba(0, 0, 0, 0.14)' },
  countBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(60, 60, 60, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
