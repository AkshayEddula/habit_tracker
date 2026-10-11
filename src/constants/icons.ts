import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

/**
 * Every pictogram in the app. Product rule: no emoji anywhere, only SF Symbols
 * (with a Material Symbol counterpart for Android and web).
 */
export const ICONS = {
  // habits
  water: { ios: 'drop.fill', md: 'water_drop' },
  book: { ios: 'book.fill', md: 'menu_book' },
  meditate: { ios: 'figure.mind.and.body', md: 'self_improvement' },
  walk: { ios: 'figure.walk', md: 'directions_walk' },
  workout: { ios: 'dumbbell.fill', md: 'fitness_center' },
  journal: { ios: 'square.and.pencil', md: 'edit_note' },
  nophone: { ios: 'iphone.slash', md: 'mobile_off' },
  sleep: { ios: 'moon.zzz.fill', md: 'bedtime' },
  meal: { ios: 'fork.knife', md: 'restaurant' },
  stretch: { ios: 'figure.flexibility', md: 'sports_gymnastics' },
  language: { ios: 'bubble.left.and.bubble.right.fill', md: 'forum' },
  bed: { ios: 'bed.double.fill', md: 'bed' },
  run: { ios: 'figure.run', md: 'directions_run' },
  bike: { ios: 'bicycle', md: 'directions_bike' },
  swim: { ios: 'figure.pool.swim', md: 'pool' },
  brain: { ios: 'brain.head.profile', md: 'psychology' },
  music: { ios: 'guitars.fill', md: 'music_note' },
  art: { ios: 'paintpalette.fill', md: 'palette' },
  pill: { ios: 'pills.fill', md: 'medication' },
  fruit: { ios: 'carrot.fill', md: 'nutrition' },
  sun: { ios: 'sun.max.fill', md: 'wb_sunny' },
  plant: { ios: 'leaf.fill', md: 'eco' },
  clean: { ios: 'sparkles', md: 'cleaning_services' },
  money: { ios: 'dollarsign.circle.fill', md: 'savings' },
  note: { ios: 'checklist', md: 'checklist' },
  gratitude: { ios: 'hands.sparkles.fill', md: 'volunteer_activism' },
  teeth: { ios: 'mouth.fill', md: 'dentistry' },
  nosmoke: { ios: 'nosign', md: 'smoke_free' },
  target: { ios: 'target', md: 'target' },
  heart: { ios: 'heart.fill', md: 'favorite' },
  pet: { ios: 'pawprint.fill', md: 'pets' },
  code: { ios: 'laptopcomputer', md: 'laptop_mac' },
  skincare: { ios: 'face.smiling', md: 'face' },
  call: { ios: 'phone.fill', md: 'call' },
  star: { ios: 'star.fill', md: 'star' },
  // game
  flame: { ios: 'flame.fill', md: 'local_fire_department' },
  gift: { ios: 'gift.fill', md: 'redeem' },
  sparkles: { ios: 'sparkles', md: 'auto_awesome' },
  check: { ios: 'checkmark.circle.fill', md: 'check_circle' },
  trophy: { ios: 'trophy.fill', md: 'trophy' },
  crown: { ios: 'crown.fill', md: 'crown' },
  shield: { ios: 'shield.fill', md: 'shield' },
  levelup: { ios: 'arrow.up.circle.fill', md: 'arrow_circle_up' },
  lock: { ios: 'lock.fill', md: 'lock' },
  calendar: { ios: 'calendar', md: 'calendar_month' },
  bolt: { ios: 'bolt.fill', md: 'bolt' },
  cards: { ios: 'rectangle.stack.fill', md: 'style' },
  diamond: { ios: 'diamond.fill', md: 'diamond' },
  rocket: { ios: 'paperplane.fill', md: 'rocket_launch' },
  steps: { ios: 'shoeprints.fill', md: 'footprint' },
  medal: { ios: 'medal.fill', md: 'military_tech' },
  seal: { ios: 'checkmark.seal.fill', md: 'verified' },
  moon: { ios: 'moon.fill', md: 'dark_mode' },
  tray: { ios: 'tray.fill', md: 'inbox' },
  question: { ios: 'questionmark', md: 'question_mark' },
  coins: { ios: 'bitcoinsign.circle.fill', md: 'paid' },
  party: { ios: 'party.popper.fill', md: 'celebration' },
} as const satisfies Record<string, { ios: SFSymbol; md: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

/** Icons offered in the habit editor. */
export const HABIT_ICONS: IconName[] = [
  'water', 'book', 'meditate', 'walk', 'workout', 'journal', 'nophone',
  'sleep', 'meal', 'stretch', 'language', 'bed', 'run', 'bike',
  'swim', 'brain', 'music', 'art', 'pill', 'fruit', 'sun',
  'plant', 'clean', 'money', 'note', 'gratitude', 'teeth', 'nosmoke',
  'target', 'heart', 'pet', 'code', 'skincare', 'call', 'star',
];

/** Habits saved by earlier versions stored an emoji; map those to icons. */
export const EMOJI_TO_ICON: Record<string, IconName> = {
  '💧': 'water', '📚': 'book', '🧘': 'meditate', '👟': 'walk', '💪': 'workout', '✍️': 'journal',
  '📵': 'nophone', '😴': 'sleep', '🥗': 'meal', '🤸': 'stretch', '🗣️': 'language', '🛏️': 'bed',
  '🏃': 'run', '🚴': 'bike', '🏊': 'swim', '🧠': 'brain', '🎸': 'music', '🎨': 'art', '💊': 'pill',
  '🍎': 'fruit', '☀️': 'sun', '🌱': 'plant', '🧹': 'clean', '💰': 'money', '📝': 'note', '🙏': 'gratitude',
  '🦷': 'teeth', '🚭': 'nosmoke', '🎯': 'target', '❤️': 'heart', '🐶': 'pet', '💻': 'code',
  '🧴': 'skincare', '📞': 'call', '🌙': 'sleep',
};
