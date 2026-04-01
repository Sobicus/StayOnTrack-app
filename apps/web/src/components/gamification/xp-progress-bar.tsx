'use client';

import { useTranslations } from 'next-intl';
import { LevelBadge } from './level-badge';

interface XpProgressBarProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
}

export function XpProgressBar({ level, currentXp, nextLevelXp, progress }: XpProgressBarProps) {
  const t = useTranslations('gamification');

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
      <LevelBadge level={level} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {t('level')} {level}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {t('xpProgress', { current: currentXp, next: nextLevelXp })}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
