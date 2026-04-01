'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api, type Achievement, type AchievementsSummary } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_ORDER = ['CALORIES', 'STREAK', 'CHECKINS', 'MONEY', 'SOCIAL', 'CHALLENGES', 'DISCIPLINE'];
const ALL_TABS = ['ALL', ...CATEGORY_ORDER] as const;

export default function AchievementsPage() {
  const { token } = useAuth();
  const t = useTranslations('achievements');
  const [data, setData] = useState<AchievementsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    if (!token) return;
    api.achievements
      .get(token)
      .then(setData)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Awards] Failed to load achievements:', msg);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="text-center py-12 text-[var(--muted)]">
          {t('couldNotLoad')}
          {error && (
            <p className="mt-2 text-xs text-red-400 font-mono break-all px-4">{error}</p>
          )}
        </div>
      </AppShell>
    );
  }

  const grouped: Record<string, Achievement[]> = {};
  for (const a of data.achievements) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{t('title')}</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-achievement/10">
          <Trophy className="w-4 h-4 text-achievement" />
          <span className="text-sm font-semibold text-achievement">
            {data.unlocked}/{data.total}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
        {ALL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]',
            )}
          >
            {tab === 'ALL' ? t('ALL') : t(`categories.${tab}`)}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {CATEGORY_ORDER.filter((cat) => activeTab === 'ALL' || cat === activeTab).map((cat) => {
          const achievements = grouped[cat];
          if (!achievements) return null;
          const unlockedCount = achievements.filter((a) => a.unlocked).length;

          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {t(`categories.${cat}`)}
                </h2>
                <span className="text-xs text-[var(--muted)]">
                  {unlockedCount}/{achievements.length}
                </span>
              </div>

              <div className="space-y-2">
                {achievements.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl border transition-all',
        a.unlocked
          ? 'bg-[var(--card)] border-achievement/30'
          : 'bg-[var(--card)]/50 border-[var(--border)] opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Emoji — always shown; grayscale + dim when locked */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0',
            a.unlocked ? 'bg-achievement/10' : 'bg-[var(--background)]',
          )}
          style={a.unlocked ? undefined : { filter: 'grayscale(1)', opacity: 0.4 }}
        >
          {a.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'font-medium truncate',
                a.unlocked ? 'text-[var(--foreground)]' : 'text-[var(--muted)]',
              )}
            >
              {a.title}
            </p>
            {a.unlocked && (
              <span className="text-xs text-achievement font-medium">✓</span>
            )}
          </div>
          <p className="text-xs text-[var(--muted)] truncate">{a.description}</p>

          {/* Progress bar */}
          {!a.unlocked && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--background)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${a.progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--muted)] whitespace-nowrap">
                {a.progressPercent}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
