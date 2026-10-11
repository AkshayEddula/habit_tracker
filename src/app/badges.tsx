import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Badge } from '@/components/badge';
import { AppText } from '@/components/ui/app-text';
import { SheetScaffold } from '@/components/sheet-scaffold';
import { Glyph } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Surface } from '@/components/ui/surface';
import { Banner, Font } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ACHIEVEMENTS } from '@/store/game';
import { useGameState } from '@/store/store';

const G = Banner.gold;

/** Every badge, with progress towards the locked ones. */
export default function Badges() {
  const state = useGameState();
  const theme = useTheme();
  // Test switch: display every badge as earned, without changing any real progress.
  const [showAll, setShowAll] = useState(false);

  const earned = ACHIEVEMENTS.filter((a) => a.unlocked(state)).length;
  const next = ACHIEVEMENTS.filter((a) => !a.unlocked(state))
    .map((a) => ({ a, p: a.progress(state) }))
    .sort((x, y) => y.p.value / y.p.target - x.p.value / x.p.target)[0];

  return (
    <SheetScaffold
      color={G.face}
      rays="#FFD633"
      onClose={() => router.back()}
      hero={
        <>
          <Badge shape="burst" tone="orange" icon="trophy" size={120} />
          <AppText style={styles.count}>
            {showAll ? ACHIEVEMENTS.length : earned}
            <AppText style={styles.countOf}> / {ACHIEVEMENTS.length}</AppText>
          </AppText>
          <AppText variant="title" color={G.text} style={styles.heroLabel}>
            badges earned
          </AppText>
        </>
      }>
        {next && !showAll && (
          <Surface style={styles.next}>
            <Badge shape={next.a.shape} tone={next.a.tone} icon={next.a.icon} size={56} />
            <View style={styles.flex}>
              <AppText variant="micro" color="flame">
                Closest to earning
              </AppText>
              <AppText variant="bodyStrong">{next.a.title}</AppText>
              <AppText variant="caption" color="textMuted">
                {next.a.description} · {next.p.value}/{next.p.target}
              </AppText>
              <View style={styles.nextBar}>
                <ProgressBar progress={next.p.value / next.p.target} color={theme.flame} track={theme.surfaceMuted} height={10} />
              </View>
            </View>
          </Surface>
        )}

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a) => {
            const got = showAll || a.unlocked(state);
            const p = a.progress(state);
            return (
              <Surface key={a.id} style={styles.badge}>
                <Badge shape={a.shape} tone={a.tone} icon={a.icon} size={76} locked={!got} />
                <AppText variant="captionStrong" align="center" numberOfLines={1} color={got ? 'text' : 'textMuted'}>
                  {a.title}
                </AppText>
                <AppText variant="caption" color="textFaint" align="center" numberOfLines={2} style={styles.desc}>
                  {a.description}
                </AppText>
                {got ? (
                  <View style={[styles.earned, { backgroundColor: theme.primarySoft }]}>
                    <Glyph name="check" size={11} color={theme.primary} />
                    <AppText variant="micro" color="primary" style={styles.small}>
                      Earned
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.progress}>
                    <ProgressBar progress={p.value / p.target} color={theme.gold} track={theme.surfaceMuted} height={8} />
                    <AppText variant="micro" color="textFaint" style={styles.small}>
                      {p.value}/{p.target}
                    </AppText>
                  </View>
                )}
              </Surface>
            );
          })}
        </View>

        <Surface style={styles.test}>
          <Glyph name="sparkles" size={20} color={theme.gold} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Show all as earned (test)</AppText>
            <AppText variant="caption" color="textMuted">
              Preview every badge in color. Doesn’t change your progress.
            </AppText>
          </View>
          <Switch value={showAll} onValueChange={setShowAll} trackColor={{ true: theme.primary, false: theme.surfaceMuted }} />
        </Surface>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  count: { fontFamily: Font.black, fontSize: 64, lineHeight: 72, color: G.text, marginTop: 4 },
  countOf: { fontFamily: Font.black, fontSize: 30, color: G.text, opacity: 0.7 },
  heroLabel: { marginTop: -6 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextBar: { marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  badge: { width: '31.5%', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingTop: 12, paddingBottom: 10 },
  desc: { fontSize: 11, lineHeight: 14, minHeight: 28 },
  earned: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, height: 20, borderRadius: 10, marginTop: 4 },
  small: { letterSpacing: 0.3, fontSize: 10 },
  progress: { alignSelf: 'stretch', alignItems: 'center', gap: 3, marginTop: 4, paddingHorizontal: 4 },
  test: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
