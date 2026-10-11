import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BouncyCritter } from '@/components/bouncy-critter';
import { BrandMark, CreatureTile } from '@/components/creature-card';
import { Critter } from '@/components/critter';
import { Flame } from '@/components/flame';
import { Glow } from '@/components/holo';
import { PackArt } from '@/components/pack-art';
import { AppText } from '@/components/ui/app-text';
import { ChunkyButton } from '@/components/ui/chunky-button';
import { Glyph, Icon } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Colors, Font, HabitColors, Radius, Squircle } from '@/constants/theme';
import { CREATURES, ELEMENTS, getCreature, STARTER_IDS } from '@/data/creatures';
import { FOCUS_AREAS, type FocusArea, HABIT_TEMPLATES, recommendedHabits } from '@/data/habit-templates';
import { useTheme } from '@/hooks/use-theme';
import { alpha } from '@/lib/color';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import { completeOnboarding } from '@/store/store';

const C = Colors.light;

type Step = 'welcome' | 'how' | 'name' | 'areas' | 'goal' | 'buddy' | 'habits' | 'pledge';
const STEPS: Step[] = ['welcome', 'how', 'name', 'areas', 'goal', 'buddy', 'habits', 'pledge'];

const STARTER_BLURB: Record<string, string> = {
  embit: 'Fiery and loyal. Perfect if you want energy to get moving.',
  bubbo: 'Calm and bubbly. Perfect if you want balance and self-care.',
  sproutle: 'Patient and kind. Perfect if you want to grow, one day at a time.',
  biscuit: 'Warm and cuddly. Perfect if you want gentle, steady encouragement.',
  pipkin: 'Chirpy and bright. Perfect if you want to own your mornings.',
  pompom: 'Sweet and bouncy. Perfect if you want habits to feel like play.',
};

const GOALS = [
  { days: 7, title: 'Warm-up', note: 'A great place to start' },
  { days: 14, title: 'Committed', note: 'Two solid weeks' },
  { days: 30, title: 'Serious', note: 'A whole month of wins' },
  { days: 50, title: 'Unstoppable', note: 'For the truly dedicated' },
];

// ---------- Welcome ----------

function Welcome({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const big = Math.min(width * 0.36, 150, height * 0.17);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.welcome, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
          <BrandMark size={26} color={C.primary} />
          <Text style={styles.wordmark}>habitlings</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.stage}>
          <View style={styles.hill} />
          <View style={styles.hello}>
            <AppText variant="captionStrong">Hi! We’re the Habitlings.</AppText>
            <View style={styles.helloTail} />
          </View>
          <View style={styles.cast}>
            <BouncyCritter spec={getCreature('bubbo').spec} size={big * 0.74} />
            <BouncyCritter spec={getCreature('embit').spec} size={big} cheer={1} />
            <BouncyCritter spec={getCreature('sproutle').spec} size={big * 0.74} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.welcomeText}>
          <Text style={styles.headline}>
            Build habits.{'\n'}
            <Text style={{ color: C.primary }}>Catch critters.</Text>
          </Text>
          <AppText variant="body" color="textMuted" align="center" style={styles.welcomeSub}>
            The fun way to build habits. Finish your day, open card packs and collect {CREATURES.length} one-of-a-kind Habitlings.
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(560)} style={styles.pills}>
          {(
            [
              { icon: 'flame', color: C.flame, label: 'Streaks' },
              { icon: 'gift', color: C.danger, label: 'Daily packs' },
              { icon: 'sparkles', color: C.gold, label: `${CREATURES.length} critters` },
            ] as const
          ).map((p) => (
            <View key={p.label} style={styles.pill}>
              <Glyph name={p.icon} size={15} color={p.color} />
              <AppText variant="captionStrong">{p.label}</AppText>
            </View>
          ))}
        </Animated.View>

        <View style={styles.flex} />
        <Animated.View entering={FadeIn.duration(500).delay(700)} style={styles.welcomeCta}>
          <ChunkyButton title="Get started" size="lg" onPress={onStart} />
          <AppText variant="caption" color="textFaint" align="center">
            Takes about a minute · No account needed
          </AppText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ---------- Pledge ----------

function HoldToCommit({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const p = useSharedValue(0);
  const [done, setDone] = useState(false);

  const complete = () => {
    setDone(true);
    haptic.success();
    playSound('perfect');
    setTimeout(onDone, 700);
  };

  const start = () => {
    if (done) return;
    haptic.tap();
    p.set(
      withTiming(1, { duration: 1400, easing: Easing.linear }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(complete);
      }),
    );
  };

  const cancel = () => {
    if (done) return;
    p.set(withTiming(0, { duration: 250 }));
  };

  const fill = useAnimatedStyle(() => ({ width: `${p.get() * 100}%` }));

  return (
    <Pressable onPressIn={start} onPressOut={cancel} accessibilityRole="button" accessibilityLabel="Hold to commit">
      <View style={[styles.holdEdge, { backgroundColor: done ? theme.primaryShade : theme.borderStrong }]}>
        <View style={[styles.hold, { backgroundColor: theme.surfaceMuted }]}>
          <Animated.View style={[styles.holdFill, { backgroundColor: theme.primary }, fill]} />
          <Icon
            ios={done ? 'checkmark.seal.fill' : 'hand.tap.fill'}
            md={done ? 'verified' : 'touch_app'}
            size={22}
            color={done ? '#FFFFFF' : theme.primary}
          />
          <Text style={[styles.holdText, { color: done ? '#FFFFFF' : theme.text }]}>
            {done ? 'Committed!' : 'Press and hold to commit'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------- Flow ----------

export default function Onboarding() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setNameDraft] = useState('');
  const [areas, setAreas] = useState<FocusArea[]>([]);
  const [goal, setGoal] = useState(7);
  const [starter, setStarter] = useState<string>('embit');
  const [picked, setPicked] = useState<string[]>([]);

  const index = STEPS.indexOf(step);
  const go = (s: Step) => {
    haptic.tap();
    setStep(s);
  };
  const back = () => go(STEPS[Math.max(0, index - 1)]);

  const finish = () => {
    completeOnboarding({
      name,
      starterId: starter,
      streakGoal: goal,
      habits: HABIT_TEMPLATES.filter((t) => picked.includes(t.title)).map(({ title, icon, color }) => ({
        title,
        icon,
        color,
      })),
    });
  };

  if (step === 'welcome') return <Welcome onStart={() => go('how')} />;

  const buddy = getCreature(starter);
  const sortedTemplates = [...HABIT_TEMPLATES].sort(
    (a, b) => Number(areas.includes(b.area)) - Number(areas.includes(a.area)),
  );

  let body: ReactNode = null;
  let footer: ReactNode = null;

  switch (step) {
    case 'how':
      body = (
        <>
          <View style={styles.howArt}>
            <View style={styles.tiltLeft}>
              <PackArt width={78} kind="daily" />
            </View>
            <Icon ios="arrow.right" md="arrow_forward" size={22} color={theme.textFaint} />
            <View style={styles.tiltRight}>
              <CreatureTile creature={getCreature('coralie')} width={92} owned={{ count: 1, firstAt: '' }} />
            </View>
          </View>
          <AppText variant="title" align="center">
            Here’s how it works
          </AppText>
          <AppText variant="body" color="textMuted" align="center">
            Four small steps, every day.
          </AppText>
          <Surface style={styles.timeline}>
            {[
              { icon: 'check' as const, color: theme.primary, title: 'Check off your habits', text: 'Each one earns XP and coins.' },
              { icon: 'gift' as const, color: theme.danger, title: 'Finish them all', text: 'A perfect day unlocks a card pack.' },
              { icon: 'sparkles' as const, color: theme.gold, title: 'Collect critters', text: `${CREATURES.length} to discover, from Common to Legendary.` },
              { icon: 'flame' as const, color: theme.flame, title: 'Keep your streak', text: 'Longer streaks mean rarer pulls.' },
            ].map((r, i, all) => (
              <Animated.View key={r.title} entering={FadeInDown.duration(320).delay(90 * i)} style={styles.stepRow}>
                <View style={styles.rail}>
                  <View style={[styles.stepDot, { backgroundColor: r.color }]}>
                    <Glyph name={r.icon} size={18} color="#FFFFFF" />
                  </View>
                  {i < all.length - 1 && <View style={[styles.stepLine, { backgroundColor: theme.border }]} />}
                </View>
                <View style={[styles.stepText, i < all.length - 1 && styles.stepGap]}>
                  <AppText variant="micro" color={r.color}>
                    Step {i + 1}
                  </AppText>
                  <AppText variant="bodyStrong">{r.title}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {r.text}
                  </AppText>
                </View>
              </Animated.View>
            ))}
          </Surface>
        </>
      );
      footer = <ChunkyButton title="Sounds fun!" size="lg" onPress={() => go('name')} />;
      break;

    case 'name':
      body = (
        <>
          <View style={styles.trio}>
            {STARTER_IDS.map((id) => (
              <BouncyCritter key={id} spec={getCreature(id).spec} size={id === 'embit' ? 104 : 78} />
            ))}
          </View>
          <AppText variant="title" align="center">
            What should we call you?
          </AppText>
          <AppText variant="body" color="textMuted" align="center">
            Your critters want to know who they’re cheering for.
          </AppText>
          <TextInput
            value={name}
            onChangeText={setNameDraft}
            placeholder="Your first name"
            placeholderTextColor={theme.textFaint}
            autoFocus
            maxLength={20}
            returnKeyType="next"
            onSubmitEditing={() => name.trim() && go('areas')}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.surface, borderColor: name ? theme.primary : theme.border },
            ]}
          />
        </>
      );
      footer = <ChunkyButton title="Continue" size="lg" disabled={!name.trim()} onPress={() => go('areas')} />;
      break;

    case 'areas':
      body = (
        <>
          <AppText variant="micro" color="primary" align="center">
            Nice to meet you, {name.trim()}
          </AppText>
          <AppText variant="title" align="center">
            What do you want to improve?
          </AppText>
          <AppText variant="body" color="textMuted" align="center">
            Pick as many as you like. We’ll suggest habits that fit.
          </AppText>
          <View style={styles.areaGrid}>
            {FOCUS_AREAS.map((a) => {
              const active = areas.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    haptic.select();
                    setAreas((list) => (active ? list.filter((x) => x !== a.id) : [...list, a.id]));
                  }}
                  aria-checked={active}
                  accessibilityRole="checkbox"
                  style={[
                    styles.area,
                    {
                      backgroundColor: active ? theme.primarySoft : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}>
                  <View style={[styles.areaIcon, { backgroundColor: alpha(HabitColors[a.color], 0.15) }]}>
                    <Glyph name={a.icon} size={24} color={HabitColors[a.color]} />
                  </View>
                  <AppText variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} align="center">
                    {a.label}
                  </AppText>
                  <View
                    style={[
                      styles.areaCheck,
                      active
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { borderColor: theme.borderStrong, backgroundColor: theme.surface },
                    ]}>
                    {active && <Icon ios="checkmark" md="check" size={12} color="#FFFFFF" weight="heavy" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      );
      footer = (
        <ChunkyButton
          title="Continue"
          size="lg"
          disabled={areas.length === 0}
          onPress={() => {
            setPicked(recommendedHabits(areas));
            go('goal');
          }}
        />
      );
      break;

    case 'goal':
      body = (
        <>
          <View style={[styles.goalFlame, { backgroundColor: theme.flameSoft }]}>
            <Flame size={54} />
          </View>
          <AppText variant="title" align="center">
            Set your streak goal
          </AppText>
          <AppText variant="body" color="textMuted" align="center">
            How many days in a row will you show up? Hit it and you’ll earn a guaranteed Streak Pack.
          </AppText>
          <View style={styles.goalList}>
            {GOALS.map((g) => {
              const active = goal === g.days;
              return (
                <Pressable
                  key={g.days}
                  onPress={() => {
                    haptic.select();
                    setGoal(g.days);
                  }}
                  aria-selected={active}
                  accessibilityRole="radio"
                  style={[
                    styles.goal,
                    {
                      backgroundColor: active ? theme.flameSoft : theme.surface,
                      borderColor: active ? theme.flame : theme.border,
                    },
                  ]}>
                  <Text style={[styles.goalDays, { color: active ? theme.flame : theme.text }]}>{g.days}</Text>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">
                      {g.days} days · {g.title}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {g.note}
                    </AppText>
                  </View>
                  <View style={[styles.radio, { borderColor: active ? theme.flame : theme.borderStrong }]}>
                    {active && <View style={[styles.radioDot, { backgroundColor: theme.flame }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      );
      footer = <ChunkyButton title={`Commit to ${goal} days`} size="lg" onPress={() => go('buddy')} />;
      break;

    case 'buddy':
      body = (
        <>
          <AppText variant="title" align="center">
            Choose your buddy
          </AppText>
          <AppText variant="body" color="textMuted" align="center">
            Your buddy cheers you on every day and becomes the first card in your Vault.
          </AppText>
          <View style={styles.starterRow}>
            {STARTER_IDS.map((sid) => {
              const c = getCreature(sid);
              const el = ELEMENTS[c.element];
              const active = starter === sid;
              return (
                <Pressable
                  key={sid}
                  onPress={() => {
                    haptic.select();
                    setStarter(sid);
                  }}
                  accessibilityRole="radio"
                  aria-selected={active}
                  accessibilityLabel={c.name}
                  style={styles.starterCell}>
                  <View
                    style={[
                      styles.starterCard,
                      {
                        backgroundColor: active ? alpha(el.color, 0.1) : theme.surface,
                        borderColor: active ? el.color : theme.border,
                      },
                    ]}>
                    {active ? <BouncyCritter spec={c.spec} size={78} cheer={1} /> : <Critter spec={c.spec} size={78} />}
                    <AppText variant="bodyStrong">{c.name}</AppText>
                    <View style={[styles.elementPill, { backgroundColor: alpha(el.color, 0.14) }]}>
                      <AppText variant="micro" color={el.color} style={styles.elementText}>
                        {el.label}
                      </AppText>
                    </View>
                    {active && (
                      <View style={[styles.selected, { backgroundColor: el.color }]}>
                        <Icon ios="checkmark" md="check" size={14} color="#FFFFFF" weight="heavy" />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Animated.View key={starter} entering={FadeIn.duration(250)} style={[styles.blurb, { backgroundColor: theme.surfaceMuted }]}>
            <AppText variant="bodyStrong" align="center">
              {STARTER_BLURB[starter]}
            </AppText>
          </Animated.View>
        </>
      );
      footer = <ChunkyButton title={`I choose ${buddy.name}!`} size="lg" onPress={() => go('habits')} />;
      break;

    case 'habits':
      body = (
        <>
          <AppText variant="title" align="center">
            Pick your first habits
          </AppText>
          <AppText variant="body" color="textMuted" align="center">
            We picked a few for you. Start small: 3 is the sweet spot, and you can change them any time.
          </AppText>
          <View style={styles.templateList}>
            {sortedTemplates.map((t) => {
              const active = picked.includes(t.title);
              const color = HabitColors[t.color];
              return (
                <Pressable
                  key={t.title}
                  onPress={() => {
                    haptic.select();
                    setPicked((p) => (active ? p.filter((x) => x !== t.title) : [...p, t.title]));
                  }}
                  accessibilityRole="checkbox"
                  aria-checked={active}
                  style={[
                    styles.template,
                    {
                      backgroundColor: active ? alpha(color, 0.1) : theme.surface,
                      borderColor: active ? color : theme.border,
                    },
                  ]}>
                  <View style={[styles.templateEmoji, { backgroundColor: alpha(color, 0.16) }]}>
                    <Glyph name={t.icon} size={22} color={color} />
                  </View>
                  <AppText variant="bodyStrong" style={styles.flex}>
                    {t.title}
                  </AppText>
                  <View
                    style={[
                      styles.tick,
                      active ? { backgroundColor: color, borderColor: color } : { borderColor: theme.borderStrong },
                    ]}>
                    {active && <Icon ios="checkmark" md="check" size={14} color="#FFFFFF" weight="heavy" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      );
      footer = (
        <>
          <AppText variant="captionStrong" color="textMuted" align="center">
            {picked.length} selected
          </AppText>
          <ChunkyButton title="Continue" size="lg" disabled={picked.length === 0} onPress={() => go('pledge')} />
        </>
      );
      break;

    case 'pledge':
      body = (
        <>
          <View style={styles.pledgeBuddy}>
            <View style={styles.centerAbs}>
              <Glow size={168} color="#FFF1B8" opacity={1} />
            </View>
            <BouncyCritter spec={buddy.spec} size={130} />
          </View>
          <AppText variant="title" align="center">
            Make it official
          </AppText>
          <View style={[styles.contract, { backgroundColor: theme.surface, borderColor: theme.gold }]}>
            <AppText variant="micro" color="goldShade" align="center">
              My commitment
            </AppText>
            <Text style={[styles.contractText, { color: theme.text }]}>
              I, {name.trim()}, will show up for my habits for{' '}
              <Text style={{ color: theme.flame }}>{goal} days in a row</Text>, with {buddy.name} by my side.
            </Text>
            <AppText variant="caption" color="textMuted" align="center">
              {picked.length} habit{picked.length === 1 ? '' : 's'} · a free Welcome Pack is waiting
            </AppText>
          </View>
        </>
      );
      footer = <HoldToCommit onDone={finish} />;
      break;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="auto" />
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={back}
          style={[styles.back, { backgroundColor: theme.surfaceMuted }]}
          accessibilityLabel="Back"
          hitSlop={10}>
          <Icon ios="chevron.left" md="arrow_back" size={16} color={theme.textMuted} />
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${(index / (STEPS.length - 1)) * 100}%` }]} />
        </View>
        <AppText variant="captionStrong" color="textFaint">
          {index}/{STEPS.length - 1}
        </AppText>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.stepContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeInRight.duration(280)} style={styles.step}>
          {body}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: theme.border, backgroundColor: theme.bg }]}>
        {footer}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  noTouch: { pointerEvents: 'none' },
  centerAbs: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },

  // welcome
  welcome: { flexGrow: 1, paddingHorizontal: 24, gap: 22, width: '100%', maxWidth: 520, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  wordmark: { fontFamily: Font.black, fontSize: 28, letterSpacing: -0.5, color: C.primary },
  stage: {
    width: '100%',
    marginTop: 8,
    paddingTop: 18,
    borderRadius: 32,
    ...Squircle,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    overflow: 'hidden',
  },
  hill: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -70,
    height: 130,
    borderRadius: 200,
    backgroundColor: '#C8EFA6',
  },
  hello: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...Squircle,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  helloTail: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  cast: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14 },
  welcomeText: { gap: 12, marginTop: 6 },
  headline: { fontFamily: Font.black, fontSize: 38, lineHeight: 44, color: C.text, textAlign: 'center', letterSpacing: -0.5 },
  welcomeSub: { paddingHorizontal: 8 },
  pills: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  pill: {
    paddingHorizontal: 9,
    height: 34,
    borderRadius: 12,
    ...Squircle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderBottomWidth: 3,
    borderColor: C.border,
  },
  welcomeCta: { gap: 10 },

  // shared step chrome
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 16, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  stepContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, width: '100%', maxWidth: 560, alignSelf: 'center' },
  step: { gap: 14 },
  footer: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  // how
  howArt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 6, height: 136 },
  tiltLeft: { transform: [{ rotate: '-8deg' }] },
  tiltRight: { transform: [{ rotate: '6deg' }] },
  timeline: { paddingVertical: 20, paddingHorizontal: 18, marginTop: 6 },
  stepRow: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 40 },
  stepDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 3, borderRadius: 2, marginVertical: 4 },
  stepText: { flex: 1, gap: 1, paddingTop: 1 },
  stepGap: { paddingBottom: 20 },

  // name
  trio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 4 },
  input: {
    marginTop: 10,
    fontFamily: Font.heavy,
    fontSize: 20,
    textAlign: 'center',
    height: 60,
    borderRadius: Radius.md,
    ...Squircle,
    borderWidth: 2,
    borderBottomWidth: 4,
  },

  // areas
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  area: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    ...Squircle,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  areaIcon: { width: 52, height: 52, borderRadius: 17, ...Squircle, alignItems: 'center', justifyContent: 'center' },
  areaCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // goal
  goalFlame: { width: 84, height: 84, borderRadius: 42, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  goalList: { gap: 10, marginTop: 6 },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: Radius.md,
    ...Squircle,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  goalDays: { fontFamily: Font.black, fontSize: 28, width: 44, textAlign: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },

  // buddy
  starterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 10 },
  starterCell: { width: '31.5%' },
  starterCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: Radius.lg,
    ...Squircle,
    borderWidth: 2.5,
    borderBottomWidth: 5,
  },
  elementPill: { paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center' },
  elementText: { letterSpacing: 0.3 },
  selected: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurb: { padding: 16, borderRadius: Radius.md, ...Squircle, marginTop: 4 },

  // habits
  templateList: { gap: 10, marginTop: 6 },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.md,
    ...Squircle,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  templateEmoji: { width: 42, height: 42, borderRadius: 13, ...Squircle, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },

  // pledge
  pledgeBuddy: { height: 170, alignItems: 'center', justifyContent: 'center' },
  contract: { padding: 20, borderRadius: Radius.lg, ...Squircle, borderWidth: 2, borderStyle: 'dashed', gap: 12 },
  contractText: { fontFamily: Font.heavy, fontSize: 19, lineHeight: 27, textAlign: 'center' },
  holdEdge: { borderRadius: Radius.md, ...Squircle, paddingBottom: 5 },
  hold: {
    height: 60,
    borderRadius: Radius.md,
    ...Squircle,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  holdFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  holdText: { fontFamily: Font.black, fontSize: 17, letterSpacing: 0.3 },
});
