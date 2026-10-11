import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BouncyCritter } from '@/components/bouncy-critter';
import { CreatureTile } from '@/components/creature-card';
import { SheetScaffold } from '@/components/sheet-scaffold';
import { AppText } from '@/components/ui/app-text';
import { Glyph } from '@/components/ui/icon';
import { CREATURES, getCreature, RARITIES, RARITY_ORDER } from '@/data/creatures';

const GAP = 12;

/** Test gallery: every Habitling fully revealed, grouped by rarity. Doesn't touch the player's collection. */
export default function Gallery() {
  const { width } = useWindowDimensions();
  const tileW = Math.floor((Math.min(width, 560) - 44 - GAP * 2) / 3);

  return (
    <SheetScaffold
      color="#58CC02"
      rays="#6BD81A"
      onClose={() => router.back()}
      hero={
        <>
          <View style={styles.cast}>
            <BouncyCritter spec={getCreature('bubbo').spec} size={84} />
            <BouncyCritter spec={getCreature('embit').spec} size={112} cheer={1} />
            <BouncyCritter spec={getCreature('pipkin').spec} size={84} />
          </View>
          <AppText variant="title" color="#FFFFFF">
            All {CREATURES.length} Habitlings
          </AppText>
          <AppText variant="captionStrong" color="rgba(255,255,255,0.9)" align="center">
            Test gallery · everything shown unlocked · your collection is unchanged
          </AppText>
        </>
      }>
        {[...RARITY_ORDER].reverse().map((r) => {
          const list = CREATURES.filter((c) => c.rarity === r);
          return (
            <View key={r} style={styles.section}>
              <View style={styles.sectionHead}>
                <Glyph name="star" size={16} color={RARITIES[r].color} />
                <AppText variant="heading" color={RARITIES[r].color}>
                  {RARITIES[r].label}
                </AppText>
                <AppText variant="captionStrong" color="textMuted">
                  {list.length}
                </AppText>
              </View>
              <View style={styles.grid}>
                {list.map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityLabel={c.name}
                    onPress={() => router.push({ pathname: '/card/[id]', params: { id: c.id, preview: '1' } })}
                    style={({ pressed }) => [pressed && styles.pressed]}>
                    <CreatureTile creature={c} width={tileW} owned={{ count: 1, firstAt: '' }} />
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  cast: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 6 },
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
