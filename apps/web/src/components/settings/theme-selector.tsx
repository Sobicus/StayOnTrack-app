'use client';

import { useState, useEffect } from 'react';
import { Check, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { THEMES, ACCENT_THEME_KEY, getThemeById, type AccentTheme } from '@/lib/themes';
import { useToast } from '@/components/ui/toast';

interface ThemeSelectorProps {
  userLevel: number;
}

export function ThemeSelector({ userLevel }: ThemeSelectorProps) {
  const t = useTranslations('settings');
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(ACCENT_THEME_KEY);
    if (saved) {
      setSelectedId(saved);
    }
  }, []);

  const handleSelect = (theme: AccentTheme) => {
    if (theme.unlockLevel > userLevel) return;

    setSelectedId(theme.id);
    localStorage.setItem(ACCENT_THEME_KEY, theme.id);

    // Apply the CSS variable immediately
    document.documentElement.style.setProperty('--accent-color', theme.color);

    showToast(t('themeApplied'), 'success');
  };

  if (!mounted) {
    return <div className="grid grid-cols-6 gap-3 h-12" />;
  }

  return (
    <div>
      <p className="font-medium text-[var(--foreground)] mb-1">{t('accentColor')}</p>
      <div className="grid grid-cols-6 gap-3">
        {THEMES.map((theme) => {
          const isUnlocked = theme.unlockLevel <= userLevel;
          const isSelected = theme.id === selectedId;

          return (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme)}
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
  );
}
