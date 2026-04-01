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

// ─── Color Themes ────────────────────────────────────────────────────────────

export interface ColorTheme {
  id: string;
  /** Display name */
  name: string;
  /** Whether this is a dark-mode theme */
  isDark: boolean;
  /** Background hex for swatch preview */
  previewBg: string;
  /** Accent hex for swatch preview dot */
  previewAccent: string;
  /** Default accent color applied when theme is activated */
  defaultAccent: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'system',
    name: 'Default',
    isDark: false,
    previewBg: '#F7F9FC',
    previewAccent: '#3b82f6',
    defaultAccent: '#3b82f6',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    isDark: true,
    previewBg: '#06080F',
    previewAccent: '#3B82F6',
    defaultAccent: '#3B82F6',
  },
  {
    id: 'forest',
    name: 'Forest',
    isDark: true,
    previewBg: '#060E09',
    previewAccent: '#10B981',
    defaultAccent: '#10B981',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    isDark: true,
    previewBg: '#0E0804',
    previewAccent: '#F97316',
    defaultAccent: '#F97316',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    isDark: false,
    previewBg: '#EFF6FF',
    previewAccent: '#0EA5E9',
    defaultAccent: '#0EA5E9',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    isDark: false,
    previewBg: '#FFF0F8',
    previewAccent: '#EC4899',
    defaultAccent: '#EC4899',
  },
  {
    id: 'neoncity',
    name: 'Neon City',
    isDark: true,
    previewBg: '#080010',
    previewAccent: '#A855F7',
    defaultAccent: '#A855F7',
  },
];

export const COLOR_THEME_KEY = 'color-theme';

export function getSavedColorThemeId(): string {
  if (typeof window === 'undefined') return 'system';
  return localStorage.getItem(COLOR_THEME_KEY) || 'system';
}

export function getColorThemeById(id: string): ColorTheme | undefined {
  return COLOR_THEMES.find((t) => t.id === id);
}

/**
 * Apply a color theme to the document:
 *  - sets data-color-theme on <html> (CSS vars pick it up)
 *  - syncs next-themes dark/light class
 *  - updates --accent-color CSS variable
 */
export function applyColorTheme(themeId: string, setNextTheme?: (t: string) => void): void {
  if (typeof document === 'undefined') return;
  const theme = getColorThemeById(themeId) ?? COLOR_THEMES[0];

  if (themeId === 'system') {
    document.documentElement.removeAttribute('data-color-theme');
  } else {
    document.documentElement.setAttribute('data-color-theme', theme.id);
  }

  // Sync dark/light for next-themes so toggle still works on default theme
  if (setNextTheme) {
    if (themeId === 'system') {
      setNextTheme('system');
    } else {
      setNextTheme(theme.isDark ? 'dark' : 'light');
    }
  }

  // Apply default accent unless user already has a custom one saved for this color theme
  const accentKey = `${COLOR_THEME_KEY}-${themeId}-accent`;
  const savedAccent = localStorage.getItem(accentKey);
  const accentColor = savedAccent ?? theme.defaultAccent;
  document.documentElement.style.setProperty('--accent-color', accentColor);
}
