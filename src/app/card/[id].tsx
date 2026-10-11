import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CreatureCard } from '@/components/creature-card';
import { SheetScaffold } from '@/components/sheet-scaffold';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { Glyph, Icon } from '@/components/ui/icon';
import { Squircle } from '@/constants/theme';
import { ELEMENTS, getCreature, RARITIES, RARITY_ORDER } from '@/data/creatures';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { cardLevel, packOdds, parseKey } from '@/store/game';
import { setBuddy, showToast, useGameState } from '@/store/store';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/vault');
}

export default function CardScreen() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  // The test gallery opens cards revealed, without granting them.
  const reveal = preview === '1';
  const state = useGameState();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const creature = getCreature(id);
  const owned = state.collection[creature.id];
  const rarity = RARITIES[creature.rarity];
  const el = ELEMENTS[creature.element];
  const cardW = Math.min(width - 150, 240);
  const isBuddy = state.buddyId === creature.id;

  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      ry.set(Math.max(-18, Math.min(18, e.translationX / 7)));
      rx.set(Math.max(-18, Math.min(18, -e.translationY / 7)));
    })
    .onEnd(() => {
      rx.set(withSpring(0, { damping: 10 }));
      ry.set(withSpring(0, { damping: 10 }));
    });
  const tilt = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateX: `${rx.get()}deg` }, { rotateY: `${ry.get()}deg` }],
  }));

  const odds = packOdds('daily', 0);

  const shown = !!owned || reveal;
  const common = creature.rarity === 'common';
  // Rarity floods the hero, the same way it does when the card is first revealed.
  const heroColor = !shown ? '#F1EEEA' : common ? '#AEB6BF' : rarity.color;
  const rayColor = !shown ? undefined : common ? '#BCC3CB' : rarity.glow;

  return (
    <SheetScaffold
      color={heroColor}
      rays={rayColor}
      onColor={shown}
      onClose={close}
      hero={
        <>
          <GestureDetector gesture={pan}>
            <Animated.View style={tilt}>
              <CreatureCard creature={creature} width={cardW} count={owned?.count ?? 1} silhouette={!shown} />
            </Animated.View>
          </GestureDetector>
          <AppText variant="captionStrong" color={shown ? 'rgba(255,255,255,0.85)' : 'textFaint'} style={styles.hint}>
            Drag the card to tilt it
          </AppText>
        </>
      }>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <AppText variant="title">{shown ? creature.name : '???'}</AppText>
          <AppText variant="caption" color="textMuted">
            {shown ? creature.flavor : 'A critter you haven’t discovered yet.'}
          </AppText>
        </View>
      </View>
      <View style={styles.pills}>
        <View style={[styles.pill, { backgroundColor: shown ? rarity.color : theme.surfaceMuted }]}>
          <Glyph name={shown ? 'star' : 'lock'} size={12} color={shown ? '#FFFFFF' : theme.textFaint} />
          <AppText variant="micro" color={shown ? '#FFFFFF' : 'textMuted'} style={styles.pillText}>
            {shown ? rarity.label : 'Undiscovered'}
          </AppText>
        </View>
        {shown && (
          <View style={[styles.pill, { backgroundColor: theme.surfaceMuted }]}>
            <Glyph name={el.icon} size={12} color={el.color} />
            <AppText variant="micro" color="textMuted" style={styles.pillText}>
              {el.label} type
            </AppText>
          </View>
        )}
      </View>

      {owned ? (
        <>
          <View style={[styles.facts, { backgroundColor: theme.surfaceMuted }]}>
            {[
              { label: 'Owned', value: `×${owned.count}` },
              { label: 'Card level', value: `LV ${cardLevel(owned.count)}` },
              {
                label: 'First caught',
                value: parseKey(owned.firstAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              },
            ].map((f, i) => (
              <View key={f.label} style={[styles.fact, i > 0 && styles.factDivider]}>
                <AppText variant="heading">{f.value}</AppText>
                <AppText variant="caption" color="textMuted">
                  {f.label}
                </AppText>
              </View>
            ))}
          </View>
          {cardLevel(owned.count) < 5 && (
            <AppText variant="caption" color="textMuted" align="center">
              Catch duplicates to level this card up to LV 5 and boost its power.
            </AppText>
          )}
          <ChunkyButton
            title={isBuddy ? `${creature.name} is your buddy` : `Make ${creature.name} your buddy`}
            size="lg"
            disabled={isBuddy}
            icon={<Icon ios="heart.fill" md="favorite" size={18} color={isBuddy ? theme.textFaint : '#FFFFFF'} />}
            onPress={() => {
              setBuddy(creature.id);
              haptic.success();
              showToast({ icon: 'heart', color: '#FF5C8A', title: `${creature.name} is your new buddy!`, subtitle: 'They’ll cheer you on from the Today tab.' });
            }}
          />
        </>
      ) : (
        <View style={styles.locked}>
          <AppText variant="heading">{reveal ? 'Drop rates' : 'How to find it'}</AppText>
          <AppText variant="body" color="textMuted">
            Complete every habit in a day to earn a pack. Longer streaks raise your odds of rarer critters.
          </AppText>
          <View style={[styles.oddsList, { backgroundColor: theme.surfaceMuted }]}>
            {RARITY_ORDER.map((r) => (
              <View key={r} style={styles.oddsRow}>
                <View style={[styles.dot, { backgroundColor: RARITIES[r].color }]} />
                <AppText variant="bodyStrong" style={styles.flex}>
                  {RARITIES[r].label}
                </AppText>
                <AppText variant="captionStrong" color={r === creature.rarity ? RARITIES[r].color : 'textMuted'}>
                  {Math.round(odds[r] * 100)}% per pack
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hint: { marginTop: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pills: { flexDirection: 'row', gap: 8, marginTop: -8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, height: 26, borderRadius: 13 },
  pillText: { letterSpacing: 0.4 },
  facts: { flexDirection: 'row', borderRadius: 20, ...Squircle, paddingVertical: 14 },
  fact: { flex: 1, alignItems: 'center', gap: 2 },
  factDivider: { borderLeftWidth: 2, borderLeftColor: '#FFFFFF' },
  locked: { gap: 10 },
  oddsList: { gap: 12, marginTop: 4, padding: 16, borderRadius: 20, ...Squircle },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
