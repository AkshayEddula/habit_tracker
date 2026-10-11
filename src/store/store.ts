import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { EMOJI_TO_ICON, type IconName, ICONS } from '@/constants/icons';
import { type HabitColor, HabitColors, LEGACY_HABIT_COLORS } from '@/constants/theme';
import { RARITIES } from '@/data/creatures';

import {
  ACHIEVEMENTS,
  addDays,
  COINS_PER_HABIT,
  currentStreak,
  chestStatus,
  DAILY_CHEST_COINS,
  dateKey,
  giftStatus,
  type GameState,
  type Habit,
  isPerfect,
  levelInfo,
  MAX_SHIELDS,
  newId,
  PACK_COST,
  PREMIUM_PACK_COST,
  QUESTS,
  questKey,
  questStatus,
  type PackKind,
  rollCreature,
  SHIELD_COST,
  STARTING_COINS,
  STREAK_MILESTONES,
  streakEndingAt,
  unlockedAchievementIds,
  XP_NEW_CARD,
  XP_PER_HABIT,
  XP_PERFECT_DAY,
} from './game';

const STORAGE_KEY = 'habitlings/state/v1';

function initialState(): GameState {
  const today = dateKey();
  return {
    version: 1,
    onboarded: false,
    name: '',
    buddyId: 'embit',
    habits: [],
    completions: {},
    perfectDays: {},
    shieldedDays: {},
    shields: 0,
    bestStreak: 0,
    xp: 0,
    coins: STARTING_COINS,
    packs: [],
    collection: {},
    pulls: [],
    lastReconciled: null,
    notice: null,
    settings: { haptics: true, sounds: true },
    streakGoal: 7,
    claimed: {},
    gift: { last: null, day: 0 },
    createdAt: today,
  };
}

/** Brings state saved by older versions up to the current shape. */
function migrate(saved: Partial<GameState>): GameState {
  const base = initialState();
  const merged: GameState = { ...base, ...saved, settings: { ...base.settings, ...saved.settings } };
  return {
    ...merged,
    habits: merged.habits.map((h) => {
      // Older saves stored an emoji per habit and used a different color set.
      const legacy = h as typeof h & { emoji?: string };
      const icon: IconName = h.icon in ICONS ? h.icon : (EMOJI_TO_ICON[legacy.emoji ?? ''] ?? 'star');
      const color = h.color in HabitColors ? h.color : (LEGACY_HABIT_COLORS[h.color] ?? 'ember');
      return { id: h.id, title: h.title, icon, color, createdAt: h.createdAt };
    }),
  };
}

// ---------- Core store ----------

let state: GameState = initialState();
let hydrated = false;
let today = dateKey();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function useGameState(): GameState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => hydrated,
  );
}

export function useToday(): string {
  return useSyncExternalStore(
    subscribe,
    () => today,
    () => today,
  );
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, 250);
}

function set(updater: (s: GameState) => GameState) {
  const prev = state;
  const next = updater(prev);
  if (next === prev) return;
  state = next;
  announceProgress(prev, next);
  emit();
  schedulePersist();
}

export async function hydrateStore() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = migrate(JSON.parse(raw) as Partial<GameState>);
    }
  } catch {
    // Corrupt or unavailable storage: start fresh rather than crash.
  }
  hydrated = true;
  today = dateKey();
  reconcile();
  emit();
}

/** Called on an interval and when the app returns to the foreground. */
export function refreshToday() {
  const now = dateKey();
  if (now === today) return;
  today = now;
  reconcile();
  emit();
}

/**
 * Walks every finished day since the last check. A missed day while a streak is alive
 * consumes a Streak Shield if one is available.
 */
function reconcile() {
  if (!state.onboarded) return;
  const yesterday = addDays(today, -1);
  if (!state.lastReconciled) {
    state = { ...state, lastReconciled: yesterday };
    schedulePersist();
    return;
  }
  if (state.lastReconciled >= yesterday) return;

  let s = state;
  let d = addDays(s.lastReconciled!, 1);
  for (let i = 0; i < 400 && d <= yesterday; i++, d = addDays(d, 1)) {
    if (s.perfectDays[d] || s.shieldedDays[d]) continue;
    const before = streakEndingAt(s, addDays(d, -1));
    if (before > 0 && s.shields > 0) {
      s = {
        ...s,
        shields: s.shields - 1,
        shieldedDays: { ...s.shieldedDays, [d]: true },
        notice: { kind: 'shield', streak: before },
      };
    }
  }
  state = { ...s, lastReconciled: yesterday };
  schedulePersist();
}

// ---------- Ephemeral UI events (toasts & confetti) ----------

export type Toast = {
  id: number;
  icon: IconName | 'coin';
  color?: string;
  title: string;
  subtitle?: string;
  /** Rewards shown as chips, e.g. "+10 XP". */
  chips?: { icon: IconName | 'coin'; text: string }[];
  /** Nudges with the same tag replace each other instead of queueing up. */
  tag?: string;
};
type UIEvent = { type: 'toast'; toast: Toast } | { type: 'confetti'; id: number };

const uiListeners = new Set<(e: UIEvent) => void>();
let eventId = 0;

export function onUIEvent(listener: (e: UIEvent) => void) {
  uiListeners.add(listener);
  return () => {
    uiListeners.delete(listener);
  };
}

export function showToast(toast: Omit<Toast, 'id'>) {
  const e: UIEvent = { type: 'toast', toast: { ...toast, id: ++eventId } };
  uiListeners.forEach((l) => l(e));
}

export function celebrate() {
  const e: UIEvent = { type: 'confetti', id: ++eventId };
  uiListeners.forEach((l) => l(e));
}

let pendingLevel: number | null = null;

/** Returns a level-up that hasn't been celebrated yet (once), or null. */
export function takePendingLevel() {
  const level = pendingLevel;
  pendingLevel = null;
  return level;
}

function announceProgress(prev: GameState, next: GameState) {
  if (!prev.onboarded || !next.onboarded) return;
  const before = levelInfo(prev.xp).level;
  const after = levelInfo(next.xp).level;
  if (after > before) {
    // Shown as a full-screen moment by whichever screen is in front (see `takePendingLevel`).
    pendingLevel = after;
  }
  const had = unlockedAchievementIds(prev);
  for (const id of unlockedAchievementIds(next)) {
    if (had.has(id)) continue;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) showToast({ icon: a.icon, color: '#FFC800', title: `Badge unlocked: ${a.title}`, subtitle: a.description });
  }
}

// ---------- Actions ----------

export type NewHabit = { title: string; icon: IconName; color: HabitColor };

export function completeOnboarding(input: {
  name: string;
  starterId: string;
  habits: NewHabit[];
  streakGoal: number;
}) {
  const day = dateKey();
  set((s) => ({
    ...s,
    onboarded: true,
    name: input.name.trim() || 'Trainer',
    buddyId: input.starterId,
    streakGoal: input.streakGoal,
    habits: input.habits.map((h) => ({ ...h, id: newId(), createdAt: day })),
    collection: { ...s.collection, [input.starterId]: { count: 1, firstAt: day } },
    pulls: [{ creatureId: input.starterId, date: day, kind: 'welcome', isNew: true }],
    packs: ['welcome'],
    lastReconciled: addDays(day, -1),
    createdAt: day,
  }));
}

export type ToggleResult = { done: boolean; perfect: boolean; milestone: number | null };

function withPerfectDay(s: GameState, day: string): { state: GameState; milestone: number | null } | null {
  if (s.perfectDays[day] || !isPerfect(s, day)) return null;
  let next: GameState = {
    ...s,
    perfectDays: { ...s.perfectDays, [day]: true },
    packs: [...s.packs, 'daily'],
    xp: s.xp + XP_PERFECT_DAY,
  };
  const streak = currentStreak(next, day);
  const milestone = STREAK_MILESTONES.includes(streak) ? streak : null;
  next = {
    ...next,
    bestStreak: Math.max(next.bestStreak, streak),
    packs: milestone ? [...next.packs, 'milestone'] : next.packs,
  };
  return { state: next, milestone };
}

export function toggleHabit(habitId: string): ToggleResult {
  const day = today;
  let result: ToggleResult = { done: false, perfect: false, milestone: null };
  set((s) => {
    const list = s.completions[day] ?? [];
    if (list.includes(habitId)) {
      return {
        ...s,
        completions: { ...s.completions, [day]: list.filter((id) => id !== habitId) },
        xp: Math.max(0, s.xp - XP_PER_HABIT),
        coins: Math.max(0, s.coins - COINS_PER_HABIT),
      };
    }
    const next: GameState = {
      ...s,
      completions: { ...s.completions, [day]: [...list, habitId] },
      xp: s.xp + XP_PER_HABIT,
      coins: s.coins + COINS_PER_HABIT,
    };
    const perfect = withPerfectDay(next, day);
    result = { done: true, perfect: !!perfect, milestone: perfect?.milestone ?? null };
    return perfect ? perfect.state : next;
  });
  return result;
}

export function addHabit(input: NewHabit) {
  set((s) => ({ ...s, habits: [...s.habits, { ...input, id: newId(), createdAt: today }] }));
}

export function updateHabit(id: string, input: NewHabit) {
  set((s) => ({ ...s, habits: s.habits.map((h) => (h.id === id ? { ...h, ...input } : h)) }));
}

export function deleteHabit(id: string): boolean {
  let perfect = false;
  set((s) => {
    const next: GameState = {
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
      completions: {
        ...s.completions,
        [today]: (s.completions[today] ?? []).filter((x) => x !== id),
      },
    };
    const p = withPerfectDay(next, today);
    perfect = !!p;
    return p ? p.state : next;
  });
  return perfect;
}

export function reorderHabits(habits: Habit[]) {
  set((s) => ({ ...s, habits }));
}

export type PackResult = {
  creatureId: string;
  kind: PackKind;
  isNew: boolean;
  coins: number;
  xp: number;
  count: number;
};

export function openPack(): PackResult | null {
  const s = state;
  const kind = s.packs[0];
  if (!kind) return null;
  const creature = rollCreature(kind, currentStreak(s, today), s.collection);
  const owned = s.collection[creature.id];
  const isNew = !owned;
  const coins = isNew ? 0 : RARITIES[creature.rarity].dupeCoins;
  const xp = isNew ? XP_NEW_CARD : 5;
  const count = (owned?.count ?? 0) + 1;
  set((prev) => ({
    ...prev,
    packs: prev.packs.slice(1),
    coins: prev.coins + coins,
    xp: prev.xp + xp,
    collection: { ...prev.collection, [creature.id]: { count, firstAt: owned?.firstAt ?? today } },
    pulls: [{ creatureId: creature.id, date: today, kind, isNew }, ...prev.pulls].slice(0, 60),
  }));
  return { creatureId: creature.id, kind, isNew, coins, xp, count };
}

export function buyPack(): boolean {
  if (state.coins < PACK_COST) return false;
  set((s) => ({ ...s, coins: s.coins - PACK_COST, packs: [...s.packs, 'shop'] }));
  return true;
}

export function buyPremiumPack(): boolean {
  if (state.coins < PREMIUM_PACK_COST) return false;
  set((s) => ({ ...s, coins: s.coins - PREMIUM_PACK_COST, packs: [...s.packs, 'premium'] }));
  return true;
}

/** Collects a finished quest's reward. Returns the reward, or null if it isn't claimable. */
export function claimQuest(id: string) {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) return null;
  const st = questStatus(state, q, today);
  if (!st.complete || st.claimed) return null;
  const key = questKey(q, today);
  set((s) => ({
    ...s,
    coins: s.coins + q.reward.coins,
    packs: q.reward.pack ? [...s.packs, q.reward.pack] : s.packs,
    claimed: { ...s.claimed, [key]: true },
  }));
  return q.reward;
}

/** Opens the daily chest once every daily quest is complete. Returns the coins won, or null. */
export function claimDailyChest() {
  const st = chestStatus(state, today);
  if (!st.complete || st.claimed) return null;
  set((s) => ({
    ...s,
    coins: s.coins + DAILY_CHEST_COINS,
    claimed: { ...s.claimed, [`chest@${today}`]: true },
  }));
  return DAILY_CHEST_COINS;
}

/** Collects today's daily gift. Returns the reward, or null if it was already collected. */
export function claimDailyGift() {
  const st = giftStatus(state, today);
  if (!st.available) return null;
  set((s) => ({
    ...s,
    coins: s.coins + st.reward.coins,
    packs: st.reward.pack ? [...s.packs, st.reward.pack] : s.packs,
    gift: { last: today, day: st.day },
  }));
  return { ...st.reward, day: st.day };
}

export function buyShield(): boolean {
  if (state.coins < SHIELD_COST || state.shields >= MAX_SHIELDS) return false;
  set((s) => ({ ...s, coins: s.coins - SHIELD_COST, shields: s.shields + 1 }));
  return true;
}

export function setBuddy(id: string) {
  if (!state.collection[id]) return;
  set((s) => ({ ...s, buddyId: id }));
}

export function setName(name: string) {
  set((s) => ({ ...s, name: name.trim() || s.name }));
}

export function setHaptics(enabled: boolean) {
  set((s) => ({ ...s, settings: { ...s.settings, haptics: enabled } }));
}

export function setSounds(enabled: boolean) {
  set((s) => ({ ...s, settings: { ...s.settings, sounds: enabled } }));
}

export function dismissNotice() {
  set((s) => ({ ...s, notice: null }));
}

export function resetProgress() {
  set(() => initialState());
}
