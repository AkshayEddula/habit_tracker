import type { IconName } from '@/constants/icons';
import type { HabitColor } from '@/constants/theme';
import { CREATURES, type Creature, type Rarity, RARITY_ORDER } from '@/data/creatures';

export type Habit = {
  id: string;
  title: string;
  icon: IconName;
  color: HabitColor;
  createdAt: string;
};

export type PackKind = 'daily' | 'milestone' | 'welcome' | 'shop' | 'premium';

export type OwnedCard = { count: number; firstAt: string };

export type Pull = { creatureId: string; date: string; kind: PackKind; isNew: boolean };

export type GameState = {
  version: 1;
  onboarded: boolean;
  name: string;
  buddyId: string;
  habits: Habit[];
  /** dateKey -> ids of habits completed that day */
  completions: Record<string, string[]>;
  /** Days where every habit was completed (the day's pack was earned). */
  perfectDays: Record<string, true>;
  /** Missed days covered by a Streak Shield. */
  shieldedDays: Record<string, true>;
  shields: number;
  bestStreak: number;
  xp: number;
  coins: number;
  /** Unopened packs, oldest first. */
  packs: PackKind[];
  collection: Record<string, OwnedCard>;
  pulls: Pull[];
  lastReconciled: string | null;
  notice: { kind: 'shield'; streak: number } | null;
  settings: { haptics: boolean; sounds: boolean };
  /** Streak length the user committed to during onboarding. */
  streakGoal: number;
  /** Claimed quest rewards, keyed by `questKey`. */
  claimed: Record<string, true>;
  /** Daily gift: the last day it was collected and the position in the 7-day cycle. */
  gift: { last: string | null; day: number };
  createdAt: string;
};

export const XP_PER_HABIT = 10;
export const COINS_PER_HABIT = 5;
export const XP_PERFECT_DAY = 50;
export const XP_NEW_CARD = 25;
export const PACK_COST = 150;
export const PREMIUM_PACK_COST = 600;
export const SHIELD_COST = 200;
export const MAX_SHIELDS = 2;
export const STARTING_COINS = 100;
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

// ---------- Dates (local calendar days as YYYY-MM-DD) ----------

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  // Noon avoids DST edge cases when adding days.
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
}

/** Monday-first week containing `key`. */
export function weekOf(key: string): string[] {
  const d = parseKey(key);
  const offset = (d.getDay() + 6) % 7;
  const monday = addDays(key, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ---------- Streaks ----------

/** Streak counting back from `end` (inclusive). Shielded days keep the chain alive but don't add to it. */
export function streakEndingAt(s: GameState, end: string): number {
  let n = 0;
  let d = end;
  for (let i = 0; i < 2000; i++) {
    if (s.perfectDays[d]) n++;
    else if (!s.shieldedDays[d]) break;
    d = addDays(d, -1);
  }
  return n;
}

/** Today's in-progress day doesn't break the streak until it's over. */
export function currentStreak(s: GameState, today: string): number {
  return streakEndingAt(s, s.perfectDays[today] ? today : addDays(today, -1));
}

export function habitStreak(s: GameState, habitId: string, today: string): number {
  let d = s.completions[today]?.includes(habitId) ? today : addDays(today, -1);
  let n = 0;
  while (n < 2000 && s.completions[d]?.includes(habitId)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function isPerfect(s: GameState, day: string): boolean {
  if (s.habits.length === 0) return false;
  const done = new Set(s.completions[day] ?? []);
  return s.habits.every((h) => done.has(h.id));
}

// ---------- Levels ----------

export function xpToNext(level: number) {
  return 100 + (level - 1) * 50;
}

export function levelInfo(xp: number) {
  let level = 1;
  let rest = xp;
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level), progress: rest / xpToNext(level) };
}

// ---------- Packs ----------

type Odds = Record<Rarity, number>;

export function packOdds(kind: PackKind, streak: number): Odds {
  if (kind === 'premium') return { common: 0, rare: 0, epic: 0.82, legendary: 0.18 };
  if (kind === 'welcome') return { common: 0, rare: 0.85, epic: 0.15, legendary: 0 };
  if (kind === 'milestone') return { common: 0, rare: 0.7, epic: 0.24, legendary: 0.06 };
  if (kind === 'daily' && streak >= 30) return { common: 0.4, rare: 0.35, epic: 0.18, legendary: 0.07 };
  if (kind === 'daily' && streak >= 7) return { common: 0.5, rare: 0.32, epic: 0.14, legendary: 0.04 };
  return { common: 0.62, rare: 0.27, epic: 0.09, legendary: 0.02 };
}

export const PACK_INFO: Record<
  PackKind,
  { title: string; subtitle: string; colors: [string, string]; foil: string }
> = {
  daily: { title: 'Daily Pack', subtitle: 'Earned with a perfect day', colors: ['#58CC02', '#3E9B00'], foil: '#FFFFFF' },
  milestone: {
    title: 'Streak Pack',
    subtitle: 'Rare or better, guaranteed',
    colors: ['#FF9600', '#E06A00'],
    foil: '#FFFFFF',
  },
  welcome: { title: 'Welcome Pack', subtitle: 'A rare friend to start', colors: ['#1FB98B', '#0E8C67'], foil: '#FFFFFF' },
  shop: { title: 'Bonus Pack', subtitle: 'One extra card, any rarity', colors: ['#FF4B4B', '#D42D2D'], foil: '#FFFFFF' },
  premium: {
    title: 'Royal Pack',
    subtitle: 'Epic or better, guaranteed',
    colors: ['#FFC800', '#EBA200'],
    foil: '#FFFFFF',
  },
};

export function rollCreature(
  kind: PackKind,
  streak: number,
  collection: Record<string, OwnedCard>,
  random: () => number = Math.random,
): Creature {
  const odds = packOdds(kind, streak);
  let r = random();
  let rarity: Rarity = 'common';
  for (const key of RARITY_ORDER) {
    if (r < odds[key]) {
      rarity = key;
      break;
    }
    r -= odds[key];
    rarity = key;
  }
  const pool = CREATURES.filter((c) => c.rarity === rarity);
  const unowned = pool.filter((c) => !collection[c.id]);
  // Lean towards new discoveries so early packs feel rewarding.
  const source = unowned.length > 0 && random() < 0.7 ? unowned : pool;
  return source[Math.floor(random() * source.length)];
}

export function cardLevel(count: number) {
  return Math.min(5, count);
}

// ---------- Stats & achievements ----------

export function totalCheckins(s: GameState) {
  let n = 0;
  for (const ids of Object.values(s.completions)) n += ids.length;
  return n;
}

export type BadgeShape = 'rosette' | 'shield' | 'hex' | 'burst';
export type BadgeTone = 'gold' | 'orange' | 'green' | 'rose' | 'mint';

export type Achievement = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  shape: BadgeShape;
  tone: BadgeTone;
  /** How far along the player is. The badge unlocks when `value` reaches `target`. */
  progress: (s: GameState) => { value: number; target: number };
  unlocked: (s: GameState) => boolean;
};

const owns = (s: GameState, rarity: Rarity) =>
  CREATURES.some((c) => c.rarity === rarity && s.collection[c.id]) ? 1 : 0;

type BadgeDef = Omit<Achievement, 'unlocked' | 'progress'> & { value: (s: GameState) => number; target: number };

const BADGES: BadgeDef[] = [
  { id: 'first-step', icon: 'steps', title: 'First Step', description: 'Complete your first habit', shape: 'rosette', tone: 'green', value: totalCheckins, target: 1 },
  { id: 'perfect-day', icon: 'star', title: 'Perfect Day', description: 'Finish every habit in a day', shape: 'burst', tone: 'gold', value: (s) => Object.keys(s.perfectDays).length, target: 1 },
  { id: 'on-fire', icon: 'flame', title: 'On Fire', description: 'Reach a 3-day streak', shape: 'shield', tone: 'orange', value: (s) => s.bestStreak, target: 3 },
  { id: 'week-warrior', icon: 'medal', title: 'Week Warrior', description: 'Reach a 7-day streak', shape: 'shield', tone: 'orange', value: (s) => s.bestStreak, target: 7 },
  { id: 'fortnight', icon: 'bolt', title: 'Locked In', description: 'Reach a 14-day streak', shape: 'shield', tone: 'rose', value: (s) => s.bestStreak, target: 14 },
  { id: 'unstoppable', icon: 'rocket', title: 'Unstoppable', description: 'Reach a 30-day streak', shape: 'shield', tone: 'gold', value: (s) => s.bestStreak, target: 30 },
  { id: 'fifty', icon: 'check', title: 'Getting Serious', description: 'Log 50 check-ins', shape: 'hex', tone: 'green', value: totalCheckins, target: 50 },
  { id: 'centurion', icon: 'seal', title: 'Centurion', description: 'Log 100 check-ins', shape: 'hex', tone: 'gold', value: totalCheckins, target: 100 },
  { id: 'collector', icon: 'cards', title: 'Collector', description: 'Discover 10 critters', shape: 'rosette', tone: 'mint', value: (s) => Object.keys(s.collection).length, target: 10 },
  { id: 'curator', icon: 'sparkles', title: 'Curator', description: 'Discover 20 critters', shape: 'rosette', tone: 'rose', value: (s) => Object.keys(s.collection).length, target: 20 },
  { id: 'epic-pull', icon: 'diamond', title: 'Epic Pull', description: 'Find an Epic critter', shape: 'burst', tone: 'rose', value: (s) => owns(s, 'epic'), target: 1 },
  { id: 'legend', icon: 'crown', title: 'Living Legend', description: 'Find a Legendary critter', shape: 'burst', tone: 'gold', value: (s) => owns(s, 'legendary'), target: 1 },
  { id: 'pack-rat', icon: 'gift', title: 'Pack Rat', description: 'Open 10 card packs', shape: 'burst', tone: 'mint', value: (s) => s.pulls.length, target: 10 },
  { id: 'level-5', icon: 'levelup', title: 'Rising Star', description: 'Reach level 5', shape: 'hex', tone: 'mint', value: (s) => levelInfo(s.xp).level, target: 5 },
  { id: 'level-10', icon: 'trophy', title: 'Habit Hero', description: 'Reach level 10', shape: 'hex', tone: 'orange', value: (s) => levelInfo(s.xp).level, target: 10 },
];

export const ACHIEVEMENTS: Achievement[] = BADGES.map(({ value, target, ...b }) => ({
  ...b,
  progress: (s) => ({ value: Math.min(target, value(s)), target }),
  unlocked: (s) => value(s) >= target,
}));

export function unlockedAchievementIds(s: GameState): Set<string> {
  return new Set(ACHIEVEMENTS.filter((a) => a.unlocked(s)).map((a) => a.id));
}

export function newId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

// ---------- Quests ----------

export type QuestPeriod = 'daily' | 'weekly';
export type QuestReward = { coins: number; pack?: PackKind };

export type Quest = {
  id: string;
  period: QuestPeriod;
  icon: IconName;
  title: string;
  description: string;
  reward: QuestReward;
  measure: (s: GameState, today: string) => { value: number; target: number };
};

function doneToday(s: GameState, today: string) {
  const ids = new Set(s.completions[today] ?? []);
  return s.habits.filter((h) => ids.has(h.id)).length;
}

function weekSoFar(today: string) {
  return weekOf(today).filter((d) => d <= today);
}

export const QUESTS: Quest[] = [
  {
    id: 'd-warmup',
    period: 'daily',
    icon: 'sun',
    title: 'Warm up',
    description: 'Check off any habit',
    reward: { coins: 10 },
    measure: (s, t) => ({ value: Math.min(1, doneToday(s, t)), target: 1 }),
  },
  {
    id: 'd-half',
    period: 'daily',
    icon: 'bolt',
    title: 'Halfway there',
    description: 'Finish half of today’s habits',
    reward: { coins: 15 },
    measure: (s, t) => {
      const target = Math.max(1, Math.ceil(s.habits.length / 2));
      return { value: Math.min(target, doneToday(s, t)), target };
    },
  },
  {
    id: 'd-flawless',
    period: 'daily',
    icon: 'star',
    title: 'Flawless',
    description: 'Complete every habit today',
    reward: { coins: 25 },
    measure: (s, t) => {
      const target = Math.max(1, s.habits.length);
      return { value: s.perfectDays[t] ? target : Math.min(target, doneToday(s, t)), target };
    },
  },
  {
    id: 'w-showup',
    period: 'weekly',
    icon: 'calendar',
    title: 'Show up',
    description: 'Check in on 5 different days',
    reward: { coins: 60 },
    measure: (s, t) => ({
      value: Math.min(5, weekSoFar(t).filter((d) => (s.completions[d]?.length ?? 0) > 0).length),
      target: 5,
    }),
  },
  {
    id: 'w-crown',
    period: 'weekly',
    icon: 'crown',
    title: 'Triple crown',
    description: 'Have 3 perfect days this week',
    reward: { coins: 0, pack: 'shop' },
    measure: (s, t) => ({ value: Math.min(3, weekSoFar(t).filter((d) => s.perfectDays[d]).length), target: 3 }),
  },
  {
    id: 'w-machine',
    period: 'weekly',
    icon: 'flame',
    title: 'Habit machine',
    description: 'Log 20 check-ins this week',
    reward: { coins: 80 },
    measure: (s, t) => ({
      value: Math.min(20, weekSoFar(t).reduce((n, d) => n + (s.completions[d]?.length ?? 0), 0)),
      target: 20,
    }),
  },
];

export function questKey(q: Quest, today: string) {
  return `${q.id}@${q.period === 'daily' ? today : weekOf(today)[0]}`;
}

export function questStatus(s: GameState, q: Quest, today: string) {
  const m = q.measure(s, today);
  return { ...m, complete: m.value >= m.target, claimed: !!s.claimed[questKey(q, today)] };
}

export function claimableQuests(s: GameState, today: string) {
  const quests = QUESTS.filter((q) => {
    const st = questStatus(s, q, today);
    return st.complete && !st.claimed;
  }).length;
  const chest = chestStatus(s, today);
  return quests + (giftStatus(s, today).available ? 1 : 0) + (chest.complete && !chest.claimed ? 1 : 0);
}

// ---------- Daily chest ----------

/** Bonus for finishing every daily quest. */
export const DAILY_CHEST_COINS = 30;

export function chestStatus(s: GameState, today: string) {
  const daily = QUESTS.filter((q) => q.period === 'daily');
  const done = daily.filter((q) => questStatus(s, q, today).complete).length;
  return { done, total: daily.length, complete: done === daily.length, claimed: !!s.claimed[`chest@${today}`] };
}

// ---------- Daily gift ----------

/** Rewards for showing up 7 days running. Missing a day restarts the cycle. */
export const GIFT_CYCLE: QuestReward[] = [
  { coins: 10 },
  { coins: 15 },
  { coins: 20 },
  { coins: 30 },
  { coins: 40 },
  { coins: 50 },
  { coins: 75, pack: 'shop' },
];

export function giftStatus(s: GameState, today: string) {
  const available = s.gift.last !== today;
  const continuing = s.gift.last === addDays(today, -1) || s.gift.last === today;
  // `day` is the slot that today's gift fills (or filled, once collected).
  const day = !continuing ? 0 : available ? (s.gift.day + 1) % GIFT_CYCLE.length : s.gift.day;
  return { available, day, reward: GIFT_CYCLE[day] };
}

/** Next streak milestone (which awards a Streak Pack) above `streak`. */
export function nextMilestone(streak: number) {
  return STREAK_MILESTONES.find((m) => m > streak) ?? streak + 50;
}
