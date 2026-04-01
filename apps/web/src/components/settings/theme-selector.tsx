'use client';

import { useState, useEffect } from 'react';
import { Check, Lock } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import {
  THEMES,
  COLOR_THEMES,
  ACCENT_THEME_KEY,
  COLOR_THEME_KEY,
  getThemeById,
  getColorThemeById,
  applyColorTheme,
  type AccentTheme,
} from '@/lib/themes';
import { useToast } from '@/components/ui/toast';

interface ThemeSelectorProps {
  userLevel: number;
}

export function ThemeSelector({ userLevel }: ThemeSelectorProps) {
  const t = useTranslations('settings');
  const { setTheme } = useTheme();
  const { showToast } = useToast();
  const [selectedAccentId, setSelectedAccentId] = useState('default');
  const [selectedColorId, setSelectedColorId] = useState('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedAccent = localStorage.getItem(ACCENT_THEME_KEY);
    if (savedAccent) setSelectedAccentId(savedAccent);
    const savedColor = localStorage.getItem(COLOR_THEME_KEY);
    if (savedColor) setSelectedColorId(savedColor);
  }, []);

  // ── Color theme handler ──────────────────────────────────────────────────
  const handleColorThemeSelect = (themeId: string) => {
    setSelectedColorId(themeId);
    localStorage.setItem(COLOR_THEME_KEY, themeId);
    applyColorTheme(themeId, setTheme);

    // Keep accent selector in sync with the new theme's default accent
    const colorTheme = getColorThemeById(themeId);
    if (colorTheme) {
      const accentKey = `${COLOR_THEME_KEY}-${themeId}-accent`;
      const saved = localStorage.getItem(accentKey);
      const effectiveAccent = saved ?? colorTheme.defaultAccent;
      // Find matching accent swatch if any
      const match = THEMES.find((a) => a.color.toLowerCase() === effectiveAccent.toLowerCase());
      setSelectedAccentId(match?.id ?? 'default');
    }

    showToast(t('themeApplied'), 'success');
  };

  // ── Accent color handler ─────────────────────────────────────────────────
  const handleAccentSelect = (theme: AccentTheme) => {
    if (theme.unlockLevel > userLevel) return;

    setSelectedAccentId(theme.id);
    localStorage.setItem(ACCENT_THEME_KEY, theme.id);
    document.documentElement.style.setProperty('--accent-color', theme.color);

    // Also persist as the per-color-theme accent override
    const accentKey = `${COLOR_THEME_KEY}-${selectedColorId}-accent`;
    localStorage.setItem(accentKey, theme.color);

    showToast(t('themeApplied'), 'success');
  };

  if (!mounted) {
    return <div className="space-y-5 h-32" />;
  }

  return (
    <div className="space-y-5">
      {/* ── Color theme ─────────────────────────────────────────────────── */}
      <div>
        <p className="font-medium text-[var(--foreground)] mb-3">{t('colorTheme')}</p>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {COLOR_THEMES.map((theme) => {
            const isSelected = theme.id === selectedColorId;
            return (
              <button
                key={theme.id}
                onClick={() => handleColorThemeSelect(theme.id)}
                className="flex flex-col items-center gap-1.5 group"
                title={theme.name}
              >
                {/* Swatch — split circle showing bg + accent */}
                <div
                  className={`relative w-10 h-10 rounded-full overflow-hidden transition-all cursor-pointer hover:scale-110 ${
                    isSelected ? 'ring-2 ring-offset-2 ring-[var(--accent-color)] ring-offset-[var(--card)]' : ''
                  }`}
                  style={{ background: theme.previewBg }}
                >
                  {/* Accent dot in bottom-right quadrant */}
                  <div
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-tl-full"
                    style={{ background: theme.previewAccent }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check
                        className="w-4 h-4 drop-shadow-md"
                        style={{ color: theme.isDark ? '#fff' : '#000' }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-[10px] leading-tight text-center text-[var(--muted)]">
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Accent color ─────────────────────────────────────────────────── */}
      <div>
        <p className="font-medium text-[var(--foreground)] mb-3">{t('accentColor')}</p>
        <div className="grid grid-cols-6 gap-3">
          {THEMES.map((theme) => {
            const isUnlocked = theme.unlockLevel <= userLevel;
            const isSelected = theme.id === selectedAccentId;

            return (
              <button
                key={theme.id}
                onClick={() => handleAccentSelect(theme)}
                disabled={!isUnlocked}
                className="flex flex-col items-center gap-1 group"
                title={isUnlocked ? theme.name : `${t('lockedTheme', { level: theme.unlockLevel })}`}
              >
                <div
                  className={`relative w-10 h-10 rounded-full transition-all ${
                    isUnlocked
                      ? 'cursor-pointer hover:scale-110'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                  style={{
                    backgroundColor: theme.color,
                    boxShadow: isSelected
                      ? `0 0 0 2px var(--card), 0 0 0 4px ${theme.color}`
                      : undefined,
                  }}
                >
                  {isSelected && isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      <Lock className="w-4 h-4 text-white/80" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] leading-tight text-center ${
                  isUnlocked ? 'text-[var(--muted)]' : 'text-[var(--muted)]/60'
                }`}>
                  {isUnlocked ? theme.name : `Lvl ${theme.unlockLevel}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
