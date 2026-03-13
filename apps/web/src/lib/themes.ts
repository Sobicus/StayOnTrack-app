export interface AccentTheme {
  id: string;
  name: string;
  color: string;
  unlockLevel: number;
}

export const THEMES: AccentTheme[] = [
  { id: 'default', name: 'Ocean Blue', color: '#3b82f6', unlockLevel: 1 },
  { id: 'emerald', name: 'Emerald', color: '#10b981', unlockLevel: 3 },
  { id: 'amber', name: 'Amber Gold', color: '#f59e0b', unlockLevel: 5 },
  { id: 'rose', name: 'Rose', color: '#f43f5e', unlockLevel: 8 },
  { id: 'violet', name: 'Violet', color: '#8b5cf6', unlockLevel: 10 },
  { id: 'crimson', name: 'Crimson', color: '#dc2626', unlockLevel: 15 },
];

export const ACCENT_THEME_KEY = 'accent-theme';
export const DEFAULT_ACCENT_COLOR = '#3b82f6';

export function getUnlockedThemes(level: number): AccentTheme[] {
  return THEMES.filter((t) => t.unlockLevel <= level);
}

export function getThemeById(id: string): AccentTheme | undefined {
  return THEMES.find((t) => t.id === id);
}

export function getSavedThemeId(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(ACCENT_THEME_KEY) || 'default';
}

export function getAccentColor(): string {
  const id = getSavedThemeId();
  const theme = getThemeById(id);
  return theme?.color ?? DEFAULT_ACCENT_COLOR;
}
