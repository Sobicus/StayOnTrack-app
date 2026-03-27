'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ReportData {
  period: string;
  date: string;
  startDate: string;
  endDate: string;
  totalCalories: number;
  totalMoney: number;
  totalWeight: number;
  totalCheckIns: number;
  avoidanceRate: number;
  topHabits: { title: string; calories: number }[];
  marathons: string;
  bigMacs: number;
}

export default function ReportPage() {
  const { token, user } = useAuth();
  const t = useTranslations('stats');
  const tc = useTranslations('common');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCard, setCurrentCard] = useState(0);
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const currencySymbol =
    ({ EUR: '\u20ac', USD: '$', GBP: '\u00a3', PLN: 'z\u0142', UAH: '\u20b4', RUB: '\u20bd' } as Record<string, string>)[
      user?.currency || 'EUR'
    ] || '\u20ac';

  useEffect(() => {
    if (!token) return;
    loadReport();
  }, [token, date]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.stats.report(token!, 'month', date);
      setReport(data as ReportData | null);
      setCurrentCard(0);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (dir: -1 | 1) => {
    const [y, m] = date.split('-').map(Number);
    const d = new Date(y, m - 1 + dir);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = (() => {
    const [y, m] = date.split('-').map(Number);
    const isRu = tc('kcal') === '\u043a\u043a\u0430\u043b';
    return new Date(y, m - 1).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  })();

  const totalCards = 5;

  const prev = () => setCurrentCard((c) => Math.max(0, c - 1));
  const next = () => setCurrentCard((c) => Math.min(totalCards - 1, c + 1));

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/stats"
          className="text-sm text-primary font-medium"
        >
          {tc('back')}
        </Link>
        <h1 className="text-lg font-bold text-[var(--foreground)]">{t('monthlyReport')}</h1>
        <div className="w-12" />
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-[var(--foreground)] min-w-[150px] text-center capitalize">
          {monthLabel}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {!report ? (
        <div className="text-center py-20">
          <p className="text-[var(--muted)] text-lg">{t('noReportData')}</p>
        </div>
      ) : (
        <>
          {/* Card display */}
          <div className="relative min-h-[320px] flex items-center justify-center mb-8">
            {/* Card 0: Total Calories */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 transition-all duration-500 ${
                currentCard === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <p className="text-sm text-[var(--muted)] mb-2 uppercase tracking-wider">
                {t('totalSaved')}
              </p>
              <p className="text-5xl font-extrabold text-[var(--foreground)] mb-2">
                {Math.round(report.totalCalories).toLocaleString()}
              </p>
              <p className="text-lg text-[var(--muted)]">{tc('kcal')}</p>
            </div>

            {/* Card 1: Top Habit */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 transition-all duration-500 ${
                currentCard === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <p className="text-sm text-[var(--muted)] mb-2 uppercase tracking-wider">
                {t('topHabit')}
              </p>
              {report.topHabits[0] && (
                <>
                  <p className="text-3xl font-extrabold text-[var(--foreground)] mb-2">
                    {report.topHabits[0].title}
                  </p>
                  <p className="text-lg text-[var(--muted)]">
                    {Math.round(report.topHabits[0].calories).toLocaleString()} {tc('kcal')}
                  </p>
                </>
              )}
            </div>

            {/* Card 2: Avoidance Rate */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 transition-all duration-500 ${
                currentCard === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <p className="text-sm text-[var(--muted)] mb-2 uppercase tracking-wider">
                {t('avoidanceRate')}
              </p>
              <div className="relative w-32 h-32 mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(report.avoidanceRate / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">
                    {report.avoidanceRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Money Saved */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 transition-all duration-500 ${
                currentCard === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <p className="text-sm text-[var(--muted)] mb-2 uppercase tracking-wider">
                {t('moneySaved')}
              </p>
              <p className="text-5xl font-extrabold text-[var(--foreground)] mb-2">
                {currencySymbol}{report.totalMoney.toFixed(2)}
              </p>
            </div>

            {/* Card 4: Fun Facts */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 transition-all duration-500 ${
                currentCard === 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <p className="text-sm text-[var(--muted)] mb-4 uppercase tracking-wider">
                {t('funFacts')}
              </p>
              <div className="space-y-4 text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {report.marathons} {t('equivalentMarathons')}
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {report.bigMacs} {t('equivalentBigMacs')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={prev}
              disabled={currentCard === 0}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalCards }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentCard(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentCard ? 'bg-primary scale-125' : 'bg-[var(--border)]'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              disabled={currentCard === totalCards - 1}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}
