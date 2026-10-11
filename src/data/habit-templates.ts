import type { IconName } from '@/constants/icons';
import type { HabitColor } from '@/constants/theme';

export type FocusArea = 'health' | 'fitness' | 'mind' | 'sleep' | 'learning' | 'focus' | 'wellbeing' | 'money';

export const FOCUS_AREAS: { id: FocusArea; icon: IconName; label: string; color: HabitColor }[] = [
  { id: 'health', icon: 'meal', label: 'Health', color: 'green' },
  { id: 'fitness', icon: 'workout', label: 'Fitness', color: 'coral' },
  { id: 'mind', icon: 'meditate', label: 'Mindfulness', color: 'mint' },
  { id: 'sleep', icon: 'sleep', label: 'Sleep', color: 'cocoa' },
  { id: 'learning', icon: 'book', label: 'Learning', color: 'gold' },
  { id: 'focus', icon: 'target', label: 'Productivity', color: 'ember' },
  { id: 'wellbeing', icon: 'heart', label: 'Relationships', color: 'rose' },
  { id: 'money', icon: 'money', label: 'Finances', color: 'olive' },
];

export type HabitTemplate = { title: string; icon: IconName; color: HabitColor; area: FocusArea };

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { title: 'Drink 8 glasses of water', icon: 'water', color: 'mint', area: 'health' },
  { title: 'Read 10 pages', icon: 'book', color: 'cocoa', area: 'learning' },
  { title: 'Meditate for 5 minutes', icon: 'meditate', color: 'green', area: 'mind' },
  { title: 'Walk 8,000 steps', icon: 'walk', color: 'olive', area: 'fitness' },
  { title: 'Work out', icon: 'workout', color: 'coral', area: 'fitness' },
  { title: 'Journal before bed', icon: 'journal', color: 'gold', area: 'mind' },
  { title: 'No phone in bed', icon: 'nophone', color: 'rose', area: 'sleep' },
  { title: 'Sleep by 11pm', icon: 'sleep', color: 'cocoa', area: 'sleep' },
  { title: 'Eat a healthy meal', icon: 'meal', color: 'green', area: 'health' },
  { title: 'Stretch for 10 minutes', icon: 'stretch', color: 'ember', area: 'fitness' },
  { title: 'Practice a language', icon: 'language', color: 'gold', area: 'learning' },
  { title: 'Make your bed', icon: 'bed', color: 'mint', area: 'focus' },
  { title: 'Plan tomorrow tonight', icon: 'note', color: 'ember', area: 'focus' },
  { title: 'One hour of deep work', icon: 'target', color: 'coral', area: 'focus' },
  { title: 'Track your spending', icon: 'money', color: 'olive', area: 'money' },
  { title: 'Write 3 things you’re grateful for', icon: 'gratitude', color: 'rose', area: 'wellbeing' },
  { title: 'Call a friend or family', icon: 'call', color: 'coral', area: 'wellbeing' },
  { title: 'Take your vitamins', icon: 'pill', color: 'mint', area: 'health' },
];

/** Up to `n` starter habits that match the chosen focus areas, falling back to popular picks. */
export function recommendedHabits(areas: FocusArea[], n = 3): string[] {
  const picks: string[] = [];
  for (const area of areas) {
    const t = HABIT_TEMPLATES.find((h) => h.area === area && !picks.includes(h.title));
    if (t) picks.push(t.title);
  }
  for (const t of HABIT_TEMPLATES) {
    if (picks.length >= n) break;
    if (!picks.includes(t.title)) picks.push(t.title);
  }
  return picks.slice(0, Math.max(n, Math.min(areas.length, 5)));
}

const KEYWORD_ICON: [string, IconName][] = [
  ['water', 'water'], ['hydrat', 'water'], ['read', 'book'], ['book', 'book'], ['meditat', 'meditate'],
  ['yoga', 'meditate'], ['walk', 'walk'], ['step', 'walk'], ['run', 'run'], ['jog', 'run'], ['gym', 'workout'],
  ['work out', 'workout'], ['workout', 'workout'], ['lift', 'workout'], ['swim', 'swim'], ['bike', 'bike'],
  ['cycl', 'bike'], ['guitar', 'music'], ['piano', 'music'], ['music', 'music'], ['draw', 'art'],
  ['paint', 'art'], ['journal', 'journal'], ['write', 'journal'], ['sleep', 'sleep'], ['bed', 'bed'],
  ['phone', 'nophone'], ['screen', 'nophone'], ['vitamin', 'pill'], ['pill', 'pill'], ['fruit', 'fruit'],
  ['veg', 'fruit'], ['eat', 'meal'], ['meal', 'meal'], ['cook', 'meal'], ['stretch', 'stretch'],
  ['language', 'language'], ['spanish', 'language'], ['french', 'language'], ['code', 'code'],
  ['study', 'brain'], ['learn', 'brain'], ['clean', 'clean'], ['tidy', 'clean'], ['save', 'money'],
  ['budget', 'money'], ['spend', 'money'], ['pray', 'gratitude'], ['gratitude', 'gratitude'],
  ['grateful', 'gratitude'], ['floss', 'teeth'], ['teeth', 'teeth'], ['smok', 'nosmoke'], ['dog', 'pet'],
  ['cat', 'pet'], ['sun', 'sun'], ['plant', 'plant'], ['goal', 'target'], ['focus', 'target'],
  ['call', 'call'], ['family', 'heart'], ['skin', 'skincare'], ['plan', 'note'],
];

/** Best-guess icon for a habit title, or null when nothing matches. */
export function suggestIcon(title: string): IconName | null {
  const t = title.toLowerCase();
  // Match at word starts so "great" doesn't count as "eat".
  return KEYWORD_ICON.find(([k]) => new RegExp(`\\b${k}`).test(t))?.[1] ?? null;
}
