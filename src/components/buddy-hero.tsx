import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BouncyCritter } from '@/components/bouncy-critter';
import { PackArt } from '@/components/pack-art';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { Icon } from '@/components/ui/icon';
import { Banner, Radius, Squircle } from '@/constants/theme';
import type { Creature } from '@/data/creatures';
import { useMidnightCountdown } from '@/hooks/use-countdown';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import { PACK_INFO, type PackKind } from '@/store/game';

const B = Banner.green;

type Props = {
  buddy: Creature;
  done: number;
  total: number;
  nextPack: PackKind | undefined;
  packCount: number;
  claimedToday: boolean;
  cheer: number;
  onOpenPack: () => void;
  onAddHabit: () => void;
};

function buddyLine({ done, total, nextPack, claimedToday }: Pick<Props, 'done' | 'total' | 'nextPack' | 'claimedToday'>) {
  if (nextPack === 'welcome') return 'I found a Welcome Pack for you! Open it, open it!';
  if (nextPack && claimedToday) return 'WE DID IT! A fresh pack is waiting for you!';
  if (nextPack) return 'You have an unopened pack. Let’s see who’s inside!';
  if (total === 0) return 'Add a habit and let’s start our adventure together!';
  if (claimedToday) return 'Perfect day! Rest up, another pack drops tomorrow.';
  if (done === 0) return 'Ready when you are! Let’s knock out the first one.';
  const left = total - done;
  if (left === 1) return 'Just ONE more and today’s pack is ours!';
  return `${left} more to go and we unlock today’s pack!`;
}

/** A little heart that floats up when you pet your buddy. */
function PetHeart() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: p.get() < 0.6 ? 1 : (1 - p.get()) / 0.4,
    transform: [{ translateY: -44 * p.get() }, { scale: 0.7 + 0.4 * p.get() }],
  }));
  return (
    <Animated.View style={[styles.petHeart, style]}>
      <Icon ios="heart.fill" md="favorite" size={22} color="#FFFFFF" />
    </Animated.View>
  );
}

/** Today's headline card: the buddy, their pep talk, and the daily pack status. */
export function BuddyHero(props: Props) {
  const { buddy, done, total, nextPack, packCount, claimedToday, cheer, onOpenPack, onAddHabit } = props;
  const countdown = useMidnightCountdown();
  const [pets, setPets] = useState(0);

  return (
    <View style={styles.hero}>
      <View style={styles.top}>
        <Pressable
          onPress={() => {
            haptic.tap();
            playSound('chirp');
            setPets((n) => n + 1);
          }}
          style={styles.buddyWrap}
          accessibilityRole="button"
          accessibilityLabel={`Pet ${buddy.name}`}>
          <View style={styles.buddyHalo} />
          <BouncyCritter spec={buddy.spec} size={108} cheer={cheer + pets} />
          {pets > 0 && <PetHeart key={pets} />}
        </Pressable>
        <View style={styles.speech}>
          <View style={styles.bubble}>
            <View style={styles.bubbleTail} />
            <AppText variant="captionStrong" style={styles.bubbleText}>
              {buddyLine(props)}
            </AppText>
          </View>
          <AppText variant="micro" color="rgba(255,255,255,0.9)">
            {buddy.name} · your buddy
          </AppText>
        </View>
      </View>

      <View style={styles.panel}>
        {nextPack ? (
          <View style={styles.packRow}>
            <View style={styles.packThumb}>
              <PackArt width={46} kind={nextPack} shimmer={false} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong" color={B.text}>
                {packCount > 1 ? `${packCount} packs ready!` : `${PACK_INFO[nextPack].title} ready!`}
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.85)">
                {PACK_INFO[nextPack].subtitle}
              </AppText>
            </View>
            <ChunkyButton title="Open" size="sm" color="#FFFFFF" shade="#D7EFC4" textColor={B.edge} onPress={onOpenPack} />
          </View>
        ) : total === 0 ? (
          <ChunkyButton
            title="Add your first habit"
            color="#FFFFFF"
            shade="#D7EFC4"
            textColor={B.edge}
            onPress={onAddHabit}
            icon={<Icon ios="plus" md="add" size={18} color={B.edge} />}
          />
        ) : claimedToday ? (
          <View style={styles.packRow}>
            <View style={styles.clock}>
              <Icon ios="clock.fill" md="schedule" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong" color={B.text}>
                Today’s pack claimed
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.85)">
                Next pack unlocks in {countdown}
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.progressBlock}>
            <View style={styles.progressHead}>
              <AppText variant="micro" color="rgba(255,255,255,0.95)">
                Daily pack progress
              </AppText>
              <AppText variant="captionStrong" color={B.text}>
                {done}/{total}
              </AppText>
            </View>
            <View style={styles.segments}>
              {Array.from({ length: total }, (_, i) => (
                <View
                  key={i}
                  style={[styles.segment, { backgroundColor: i < done ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }]}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: B.face,
    borderRadius: Radius.xl,
    ...Squircle,
    borderBottomWidth: 6,
    borderBottomColor: B.edge,
    padding: 18,
    gap: 16,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buddyWrap: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  buddyHalo: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: B.soft,
  },
  petHeart: { position: 'absolute', top: 4, right: 10, pointerEvents: 'none' },
  speech: { flex: 1, gap: 8 },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    ...Squircle,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  bubbleTail: {
    position: 'absolute',
    left: -6,
    top: 18,
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: { fontSize: 14, lineHeight: 19 },
  panel: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 18,
    ...Squircle,
    padding: 14,
  },
  packRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  packThumb: { transform: [{ rotate: '-8deg' }] },
  clock: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: B.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  progressBlock: { gap: 10 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segments: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 12, borderRadius: 6 },
});
