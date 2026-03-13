'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslations } from 'next-intl';
import {
  Flame,
  DollarSign,
  Scale,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface Stats {
  totalSavedCalories: number;
  totalSavedMoney: number;
  potentialWeightAvoidedKg: number;
  totalCheckIns: number;
  totalDaysTracked: number;
}

interface Streak {
  currentStreak: number;
  bestStreak: number;
  streakShieldsRemaining: number;
  isShieldActive: boolean;
}

interface TodayLog {
  id: string;
  habitId: string;
  status: string;
  savedCalories: number;
  savedMoney: number;
  habit?: { title: string; emoji: string };
}

export default function DashboardPage() {
  const { token } = useAuth();
  const t = useTranslations('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [todayLogs, setTodayLogs] = useState<TodayLog[]>([]);
  const [equivalents, setEquivalents] = useState<any[]>([]);
  const [habits, setHabits] = useState<Record<string, { title: string; emoji: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [s, st, logs, eq, h] = await Promise.all([
        api.stats.get(token!),
        api.streaks.get(token!),
        api.habitLogs.today(token!).catch(() => []),
        api.stats.equivalents(token!).catch(() => []),
        api.habits.list(token!).catch(() => []),
      ]);
      setStats(s);
      setStreak(st);
      setTodayLogs(logs);
      setEquivalents(eq.slice(0, 4));
      const map: Record<string, { title: string; emoji: string }> = {};
      for (const habit of h) {
        map[habit.id] = { title: habit.title, emoji: habit.emoji };
      }
      setHabits(map);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Streak Banner */}
      {streak && (
        <div className="bg-gradient-to-r from-streak/20 to-primary/20 rounded-2xl p-4 mb-6 border border-streak/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-streak/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-streak" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {streak.currentStreak !== 1
                    ? t('daysPlural', { count: streak.currentStreak })
                    : t('daysSingular', { count: streak.currentStreak })}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {t('bestStreak', { count: streak.bestStreak })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
              <Shield className="w-4 h-4" />
              {streak.streakShieldsRemaining !== 1
                ? t('shieldsPlural', { count: streak.streakShieldsRemaining })
                : t('shieldsSingular', { count: streak.streakShieldsRemaining })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={<Zap className="w-5 h-5 text-warning" />}
            label={t('caloriesSaved')}
            value={Math.round(stats.totalSavedCalories).toLocaleString()}
            unit="kcal"
            color="warning"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-success" />}
            label={t('moneySaved')}
            value={`€${stats.totalSavedMoney.toFixed(2)}`}
            color="success"
          />
          <StatCard
            icon={<Scale className="w-5 h-5 text-primary" />}
            label={t('weightAvoided')}
            value={stats.potentialWeightAvoidedKg.toFixed(2)}
            unit="kg"
            color="primary"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-streak" />}
            label={t('checkIns')}
            value={stats.totalCheckIns.toString()}
            unit="total"
            color="streak"
          />
        </div>
      )}

      {/* Effort Equivalents */}
      {equivalents.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
            {t('equivalentTo')}
          </h2>
          <div className="space-y-2">
            {equivalents.map((eq) => (
              <div
                key={eq.activitySlug}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]"
              >
                <span className="text-sm text-[var(--foreground)]">{eq.activityName}</span>
                <span className="text-sm font-semibold text-primary">
                  {eq.amount} {eq.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Check-ins */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
          {t('todayCheckins')}
        </h2>
        {todayLogs.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[var(--muted)]">{t('noCheckinsYet')}</p>
            <a
              href="/habits"
              className="text-primary text-sm hover:underline mt-2 inline-block"
            >
              {t('goToCheckin')}
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]"
              >
                {habits[log.habitId]?.emoji && (
                  <span className="text-lg">{habits[log.habitId].emoji}</span>
                )}
                <StatusIcon status={log.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {habits[log.habitId]?.title || t('habit')}
                  </p>
                </div>
                {log.savedCalories > 0 && (
                  <span className="text-xs text-success font-medium">
                    +{Math.round(log.savedCalories)} kcal
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-xl font-bold text-[var(--foreground)]">
        {value}
        {unit && <span className="text-xs font-normal text-[var(--muted)] ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'AVOIDED':
      return <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />;
    case 'PARTIAL':
      return <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />;
    case 'CONSUMED':
      return <XCircle className="w-5 h-5 text-danger flex-shrink-0" />;
    default:
      return <CheckCircle2 className="w-5 h-5 text-[var(--muted)] flex-shrink-0" />;
  }
}
