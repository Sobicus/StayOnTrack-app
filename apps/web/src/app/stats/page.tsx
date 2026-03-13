'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslations } from 'next-intl';
import {
  Zap,
  DollarSign,
  Scale,
  CheckCircle2,
  Calendar,
  Dumbbell,
} from 'lucide-react';

interface Stats {
  totalSavedCalories: number;
  totalSavedMoney: number;
  potentialWeightAvoidedKg: number;
  totalCheckIns: number;
  totalDaysTracked: number;
}

interface Equivalent {
  activitySlug: string;
  activityName: string;
  unit: string;
  amount: number;
}

export default function StatsPage() {
  const { token, user } = useAuth();
  const t = useTranslations('stats');
  const tc = useTranslations('common');
  const [stats, setStats] = useState<Stats | null>(null);
  const [equivalents, setEquivalents] = useState<Equivalent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const [s, eq] = await Promise.all([
        api.stats.get(token!),
        api.stats.equivalents(token!),
      ]);
      setStats(s);
      setEquivalents(eq);
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

  if (!stats) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-[var(--muted)]">{t('noStatsYet')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-6">{t('yourProgress')}</h1>

      {/* Big stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <BigStat
          icon={<Zap className="w-6 h-6 text-warning" />}
          value={Math.round(stats.totalSavedCalories).toLocaleString()}
          unit={tc('kcal')}
          label={t('caloriesSaved')}
          bgColor="bg-warning/10"
        />
        <BigStat
          icon={<DollarSign className="w-6 h-6 text-success" />}
          value={`€${stats.totalSavedMoney.toFixed(2)}`}
          label={t('moneySaved')}
          bgColor="bg-success/10"
        />
        <BigStat
          icon={<Scale className="w-6 h-6 text-primary" />}
          value={stats.potentialWeightAvoidedKg.toFixed(2)}
          unit={tc('kg')}
          label={t('weightAvoided')}
          bgColor="bg-primary/10"
        />
        <BigStat
          icon={<Calendar className="w-6 h-6 text-streak" />}
          value={stats.totalDaysTracked.toString()}
          unit={tc('days')}
          label={t('daysTracked')}
          bgColor="bg-streak/10"
        />
      </div>

      {/* Effort equivalents */}
      {equivalents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {t('effortEquivalents')}
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)] mb-4">
            {t('savedCaloriesEqual', { count: Math.round(stats.totalSavedCalories).toLocaleString() })}
          </p>
          <div className="space-y-2">
            {equivalents.map((eq) => (
              <div
                key={eq.activitySlug}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
              >
                <span className="text-sm text-[var(--foreground)]">
                  {eq.activityName}
                </span>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{eq.amount}</span>
                  <span className="text-xs text-[var(--muted)] ml-1">{eq.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function BigStat({
  icon,
  value,
  unit,
  label,
  bgColor,
}: {
  icon: React.ReactNode;
  value: string;
  unit?: string;
  label: string;
  bgColor: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">
        {value}
        {unit && <span className="text-xs font-normal text-[var(--muted)] ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-[var(--muted)] mt-1">{label}</p>
    </div>
  );
}
