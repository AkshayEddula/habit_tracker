import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { CreatureCard, CreatureTile } from '@/components/creature-card';
import { PackArt } from '@/components/pack-art';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { CoinIcon, Glyph, Icon } from '@/components/ui/icon';
import { ScreenScroll } from '@/components/ui/screen-scroll';
import { StatChip } from '@/components/ui/stat-chip';
import { Surface } from '@/components/ui/surface';
import type { IconName } from '@/constants/icons';
import { Banner, MaxContentWidth, Radius, Squircle } from '@/constants/theme';
import {
  CREATURES,
  type Creature,
  ELEMENT_ORDER,
  ELEMENTS,
  type ElementId,
  RARITIES,
  RARITY_ORDER,
} from '@/data/creatures';
import { useTheme } from '@/hooks/use-theme';
import { alpha } from '@/lib/color';
import { haptic } from '@/lib/haptics';
import { cardLevel, MAX_SHIELDS, PACK_COST, packOdds, PACK_INFO, PREMIUM_PACK_COST, SHIELD_COST } from '@/store/game';
import { buyPack, buyPremiumPack, buyShield, showToast, useGameState } from '@/store/store';

const GAP = 12;

const G = Banner.gold;

function CompletionRing({ value, total, size = 104 }: { value: number; total: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const p = total ? value / total : 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Circle cx={50} cy={50} r={r} stroke="rgba(0,0,0,0.1)" strokeWidth={9} fill="none" />
        <Circle
          cx={50}
          cy={50}
          r={r}
          stroke="#FFFFFF"
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c * p} ${c}`}
          transform="rotate(-90 50 50)"
        />
      </Svg>
      <AppText variant="title" color={G.text} style={styles.ringValue}>
        {value}
      </AppText>
      <AppText variant="micro" color={G.text} style={styles.ringTotal}>
        of {total}
      </AppText>
    </View>
  );
}

function Gem({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 3 H17 L22 9 L12 21 L2 9 Z" fill={color} />
      <Path d="M2 9 H22 M7 3 L12 9 L17 3 M12 9 L12 21" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} fill="none" />
    </Svg>
  );
}

function rank(c: Creature) {
  return RARITY_ORDER.indexOf(c.rarity) * 1000 + c.power;
}

export default function VaultScreen() {
  const state = useGameState();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<ElementId | 'all'>('all');
  // The active segment lives in the route so other screens can deep-link to the shop.
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab = params.tab === 'shop' ? 'shop' : 'critters';
  const setTab = (next: 'critters' | 'shop') => router.setParams({ tab: next });

  const contentW = Math.min(width, MaxContentWidth) - 40;
  const tileW = Math.floor((contentW - GAP * 2) / 3);
  const owned = CREATURES.filter((c) => state.collection[c.id]);
  const showcase = [...owned].sort((a, b) => rank(b) - rank(a)).slice(0, 8);
  const power = owned.reduce((n, c) => n + c.power + (cardLevel(state.collection[c.id].count) - 1) * 10, 0);
  const rarest = showcase[0];
  const rareOwned = showcase.length ? [...owned].filter((c) => c.rarity !== 'common').sort((a, b) => rank(b) - rank(a)) : [];
  const rareFinds = rareOwned.filter((c) => c.id !== rarest?.id);
  const rareTotal = CREATURES.filter((c) => c.rarity !== 'common').length;
  const openCard = (id: string) => {
    haptic.tap();
    router.push({ pathname: '/card/[id]', params: { id } });
  };
  const list = filter === 'all' ? CREATURES : CREATURES.filter((c) => c.element === filter);
  const packs = state.packs.length;

  const buy = (ok: boolean, icon: IconName, title: string, subtitle: string) => {
    if (ok) {
      haptic.success();
      showToast({ icon, color: theme.gold, title, subtitle });
    } else haptic.warning();
  };

  const coinsNeeded = (cost: number) =>
    state.coins >= cost ? 'Ready to buy' : `${cost - state.coins} more coins needed`;

  return (
    <ScreenScroll>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="micro" color="textMuted">
            Your collection
          </AppText>
          <AppText variant="title">Vault</AppText>
        </View>
        <StatChip label={`${state.coins} coins`} icon={<CoinIcon size={20} />} value={state.coins} color={theme.goldShade} />
      </View>

      <View style={[styles.segment, { backgroundColor: theme.surfaceMuted }]}>
        {(
          [
            { id: 'critters', label: 'Critters', icon: 'cards' },
            { id: 'shop', label: 'Shop', icon: 'gift' },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                haptic.select();
                setTab(t.id);
              }}
              accessibilityRole="tab"
              aria-selected={active}
              style={[
                styles.segmentItem,
                active && { backgroundColor: theme.surface, borderColor: theme.border, borderBottomColor: theme.borderStrong },
              ]}>
              <Glyph name={t.icon} size={16} color={active ? theme.primary : theme.textMuted} />
              <AppText variant="bodyStrong" color={active ? 'text' : 'textMuted'}>
                {t.label}
              </AppText>
              {t.id === 'shop' && packs > 0 && (
                <View style={[styles.segmentBadge, { backgroundColor: theme.danger }]}>
                  <AppText variant="micro" color="#FFFFFF" style={styles.featuredText}>
                    {packs}
                  </AppText>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {tab === 'critters' ? (
        <>
      {/* Vault hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <CompletionRing value={owned.length} total={CREATURES.length} />
          <View style={styles.flex}>
            <AppText variant="micro" color={G.text}>
              Vault power
            </AppText>
            <AppText variant="display" color={G.text} style={styles.power}>
              {power.toLocaleString()}
            </AppText>
            {rarest && (
              <AppText variant="captionStrong" color={G.text} numberOfLines={1} style={styles.dim}>
                Rarest find: {rarest.name} · {RARITIES[rarest.rarity].label}
              </AppText>
            )}
          </View>
        </View>
        <View style={styles.gems}>
          {RARITY_ORDER.map((r) => {
            const all = CREATURES.filter((c) => c.rarity === r);
            const got = all.filter((c) => state.collection[c.id]).length;
            return (
              <View key={r} style={styles.gem}>
                <Gem color={RARITIES[r].color} />
                <View>
                  <AppText variant="micro" color={G.text} style={styles.gemLabel}>
                    {RARITIES[r].label}
                  </AppText>
                  <AppText variant="captionStrong" color={G.text}>
                    {got}/{all.length}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Showcase */}
      {rarest && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="heading">Showcase</AppText>
            <AppText variant="captionStrong" color="textMuted">
              Your rarest critter
            </AppText>
          </View>
          <Pressable onPress={() => openCard(rarest.id)} style={({ pressed }) => [pressed && styles.pressed]}>
            <View
              style={[
                styles.spotlight,
                { backgroundColor: alpha(RARITIES[rarest.rarity].color, 0.1), borderColor: RARITIES[rarest.rarity].color },
              ]}>
              <View style={styles.spotCard}>
                <CreatureCard creature={rarest} width={132} count={state.collection[rarest.id].count} />
              </View>
              <View style={styles.spotInfo}>
                <View style={[styles.rarityPill, { backgroundColor: RARITIES[rarest.rarity].color }]}>
                  <Glyph name="star" size={11} color="#FFFFFF" />
                  <AppText variant="micro" color="#FFFFFF" style={styles.featuredText}>
                    {RARITIES[rarest.rarity].label}
                  </AppText>
                </View>
                <AppText variant="title" numberOfLines={1}>
                  {rarest.name}
                </AppText>
                <View style={styles.spotStats}>
                  <View style={styles.spotStat}>
                    <Glyph name="bolt" size={14} color={theme.gold} />
                    <AppText variant="captionStrong">
                      {rarest.power + (cardLevel(state.collection[rarest.id].count) - 1) * 10} power
                    </AppText>
                  </View>
                  <View style={styles.spotStat}>
                    <Glyph name={ELEMENTS[rarest.element].icon} size={14} color={ELEMENTS[rarest.element].color} />
                    <AppText variant="captionStrong">{ELEMENTS[rarest.element].label} type</AppText>
                  </View>
                  <View style={styles.spotStat}>
                    <Glyph name="cards" size={14} color={theme.textMuted} />
                    <AppText variant="captionStrong">
                      Level {cardLevel(state.collection[rarest.id].count)} · owned ×{state.collection[rarest.id].count}
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color="textMuted">
                  Only {Math.round(packOdds('daily', 0)[rarest.rarity] * 100)}% of daily packs hold a{' '}
                  {RARITIES[rarest.rarity].label} critter.
                </AppText>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* Rare finds */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading">Rare finds</AppText>
          <AppText variant="captionStrong" color="textMuted">
            {rareOwned.length} of {rareTotal} rare or better
          </AppText>
        </View>
        {rareFinds.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.showcase}
            style={styles.bleed}
            decelerationRate="fast"
            snapToInterval={140 + 12}>
            {rareFinds.map((c) => (
              <Pressable key={c.id} onPress={() => openCard(c.id)} style={({ pressed }) => [pressed && styles.pressed]}>
                <CreatureCard creature={c} width={140} count={state.collection[c.id].count} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Surface style={styles.emptyPacks}>
            <View style={[styles.lockBadge, { backgroundColor: theme.goldSoft }]}>
              <Glyph name="diamond" size={18} color={theme.goldShade} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">Your rare shelf is waiting</AppText>
              <AppText variant="caption" color="textMuted">
                Rare, Epic and Legendary critters you catch will be displayed here. Longer streaks improve your odds.
              </AppText>
            </View>
          </Surface>
        )}
      </View>

      {/* Critterdex */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading">Critterdex</AppText>
          <AppText variant="captionStrong" color="textMuted">
            {owned.length}/{CREATURES.length} discovered
          </AppText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.bleed}>
          {(['all', ...ELEMENT_ORDER] as const).map((key) => {
            const active = filter === key;
            const pool = key === 'all' ? CREATURES : CREATURES.filter((c) => c.element === key);
            const label = `${key === 'all' ? 'All' : ELEMENTS[key].label} ${pool.filter((c) => state.collection[c.id]).length}/${pool.length}`;
            const tint = active ? theme.bg : key === 'all' ? theme.textMuted : ELEMENTS[key].color;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  haptic.select();
                  setFilter(key);
                }}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? theme.text : theme.surface,
                    borderColor: active ? theme.text : theme.border,
                  },
                ]}>
                <Glyph name={key === 'all' ? 'sparkles' : ELEMENTS[key].icon} size={14} color={tint} />
                <AppText variant="captionStrong" color={active ? theme.bg : 'textMuted'}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {list.map((c) => (
            <Pressable
              key={c.id}
              accessibilityLabel={state.collection[c.id] ? c.name : 'Undiscovered critter'}
              onPress={() => {
                haptic.tap();
                router.push({ pathname: '/card/[id]', params: { id: c.id } });
              }}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <CreatureTile creature={c} width={tileW} owned={state.collection[c.id]} />
            </Pressable>
          ))}
        </View>
      </View>
        </>
      ) : (
        <>
      {/* Pack inventory */}
      {packs > 0 ? (
        <Pressable onPress={() => router.push('/pack')}>
          <Surface style={styles.inbox}>
            <View style={styles.packStack}>
              {state.packs.slice(0, 3).map((k, i, arr) => (
                <View
                  key={i}
                  style={[
                    styles.stacked,
                    {
                      transform: [
                        { rotate: `${(i - (arr.length - 1) / 2) * 9}deg` },
                        { translateX: (i - (arr.length - 1) / 2) * 12 },
                      ],
                    },
                  ]}>
                  <PackArt width={54} kind={k} shimmer={i === arr.length - 1} />
                </View>
              ))}
            </View>
            <View style={styles.flex}>
              <AppText variant="micro" color="primary">
                Unopened
              </AppText>
              <AppText variant="heading">
                {packs === 1 ? PACK_INFO[state.packs[0]].title : `${packs} packs waiting`}
              </AppText>
              <AppText variant="caption" color="textMuted">
                Who’s inside? Only one way to find out.
              </AppText>
            </View>
            <ChunkyButton title="Open" size="sm" onPress={() => router.push('/pack')} />
          </Surface>
        </Pressable>
      ) : (
        <Surface style={styles.emptyPacks}>
          <View style={[styles.lockBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Icon ios="lock.fill" md="lock" size={18} color={theme.textMuted} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">No packs waiting</AppText>
            <AppText variant="caption" color="textMuted">
              Finish every habit today to earn your next Daily Pack.
            </AppText>
          </View>
        </Surface>
      )}

      {/* Trading Post */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading">Trading Post</AppText>
          <AppText variant="captionStrong" color="textMuted">
            Spend your coins
          </AppText>
        </View>

        <Surface style={[styles.royal, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <View style={styles.royalPack}>
            <PackArt width={70} kind="premium" />
          </View>
          <View style={styles.flex}>
            <View style={[styles.featured, { backgroundColor: theme.gold }]}>
              <AppText variant="micro" color={theme.goldText} style={styles.featuredText}>
                Featured
              </AppText>
            </View>
            <AppText variant="heading">Royal Pack</AppText>
            <AppText variant="caption" color="textMuted">
              Epic or Legendary, guaranteed
            </AppText>
            <ChunkyButton
              title={PREMIUM_PACK_COST.toLocaleString()}
              size="sm"
              color={theme.gold}
              shade={theme.goldShade}
              textColor={theme.goldText}
              icon={<CoinIcon size={16} />}
              disabled={state.coins < PREMIUM_PACK_COST}
              onPress={() => buy(buyPremiumPack(), 'crown', 'Royal Pack added!', 'An Epic or Legendary critter awaits.')}
              style={styles.royalButton}
            />
            <AppText variant="caption" color="textFaint" style={styles.need}>
              {coinsNeeded(PREMIUM_PACK_COST)}
            </AppText>
          </View>
        </Surface>

        <View style={styles.shop}>
          <Surface style={styles.shopItem}>
            <View style={styles.shopArt}>
              <PackArt width={46} kind="shop" shimmer={false} />
            </View>
            <AppText variant="bodyStrong" align="center">
              Bonus Pack
            </AppText>
            <AppText variant="caption" color="textMuted" align="center" style={styles.shopDesc}>
              One extra card, any rarity
            </AppText>
            <ChunkyButton
              title={String(PACK_COST)}
              size="sm"
              color={theme.gold}
              shade={theme.goldShade}
              textColor={theme.goldText}
              icon={<CoinIcon size={16} />}
              disabled={state.coins < PACK_COST}
              onPress={() => buy(buyPack(), 'gift', 'Bonus Pack added!', 'Open it whenever you like.')}
              style={styles.stretch}
            />
            <AppText variant="caption" color="textFaint" style={styles.need}>
              {coinsNeeded(PACK_COST)}
            </AppText>
          </Surface>
          <Surface style={styles.shopItem}>
            <View style={styles.shopArt}>
              <View style={[styles.shieldArt, { backgroundColor: theme.surfaceMuted }]}>
                <Icon ios="shield.fill" md="shield" size={34} color={theme.shield} />
              </View>
            </View>
            <AppText variant="bodyStrong" align="center">
              Streak Shield
            </AppText>
            <AppText variant="caption" color="textMuted" align="center" style={styles.shopDesc}>
              Saves a missed day · {state.shields}/{MAX_SHIELDS}
            </AppText>
            <ChunkyButton
              title={state.shields >= MAX_SHIELDS ? 'Maxed' : String(SHIELD_COST)}
              size="sm"
              color={theme.gold}
              shade={theme.goldShade}
              textColor={theme.goldText}
              icon={state.shields >= MAX_SHIELDS ? undefined : <CoinIcon size={16} />}
              disabled={state.coins < SHIELD_COST || state.shields >= MAX_SHIELDS}
              onPress={() =>
                buy(buyShield(), 'shield', 'Streak Shield equipped', 'It auto-saves your streak if you miss a day.')
              }
              style={styles.stretch}
            />
            <AppText variant="caption" color="textFaint" style={styles.need}>
              {state.shields >= MAX_SHIELDS ? 'Fully stocked' : coinsNeeded(SHIELD_COST)}
            </AppText>
          </Surface>
        </View>
      </View>

        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  flex: { flex: 1 },
  hero: {
    backgroundColor: G.face,
    borderRadius: Radius.xl,
    ...Squircle,
    borderBottomWidth: 6,
    borderBottomColor: G.edge,
    padding: 18,
    gap: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringValue: { lineHeight: 30 },
  ringTotal: { letterSpacing: 0.5 },
  power: { fontSize: 36, lineHeight: 42 },
  dim: { opacity: 0.75 },
  gems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: G.soft,
    borderRadius: 16,
    ...Squircle,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  gem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gemLabel: { letterSpacing: 0.3, fontSize: 9.5 },
  section: { gap: 12 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 18, ...Squircle, gap: 4 },
  segmentItem: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    ...Squircle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  segmentBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  bleed: { marginHorizontal: -20 },
  showcase: { gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
  spotlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: Radius.xl,
    ...Squircle,
    borderWidth: 2,
    borderBottomWidth: 5,
  },
  spotCard: { transform: [{ rotate: '-4deg' }] },
  spotInfo: { flex: 1, gap: 8 },
  rarityPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    height: 22,
    borderRadius: 11,
  },
  spotStats: { gap: 5 },
  spotStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inbox: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  packStack: { width: 86, height: 82, alignItems: 'center', justifyContent: 'center' },
  stacked: { position: 'absolute' },
  emptyPacks: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  royal: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  royalPack: { transform: [{ rotate: '-6deg' }], marginLeft: 6 },
  featured: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  featuredText: { letterSpacing: 0.8 },
  royalButton: { alignSelf: 'flex-start', marginTop: 10, minWidth: 130 },
  shop: { flexDirection: 'row', gap: 12 },
  shopItem: { flex: 1, alignItems: 'center', gap: 6 },
  shopArt: { height: 70, justifyContent: 'center', alignItems: 'center' },
  shieldArt: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  shopDesc: { minHeight: 36 },
  stretch: { alignSelf: 'stretch', marginTop: 4 },
  need: { fontSize: 12, marginTop: 2 },
  filters: { gap: 8, paddingHorizontal: 20 },
  filter: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
