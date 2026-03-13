'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslations } from 'next-intl';
import {
  Zap,
  DollarSign,
  Scale,
  Calendar,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

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

interface TrendPoint {
  week: string;
  savedCalories: number;
  savedMoney: number;
}

interface LogEntry {
  id: string;
  habitId: string;
  date: string;
  status: string;
  savedCalories: number;
  savedMoney: number;
}

function getWeekDates(offset: number): { start: string; end: string; days: string[] } {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return { start: days[0], end: days[6], days };
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const start = firstDay.toISOString().split('T')[0];
  const end = lastDay.toISOString().split('T')[0];
  // Build calendar grid
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
  const totalDays = lastDay.getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(date);
  }
  return { start, end, cells, year, month };
}

const SHORT_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const SHORT_DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function StatsPage() {
  const { token, user } = useAuth();
  const t = useTranslations('stats');
  const tc = useTranslations('common');
  const [stats, setStats] = useState<Stats | null>(null);
  const [equivalents, setEquivalents] = useState<Equivalent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekLogs, setWeekLogs] = useState<LogEntry[]>([]);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [calLogs, setCalLogs] = useState<LogEntry[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);

  useEffect(() => {
    if (!token) return;
    loadStats();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadWeekData();
  }, [token, weekOffset]);

  useEffect(() => {
    if (!token) return;
    loadCalendarData();
  }, [token, calMonth.year, calMonth.month]);

  const loadStats = async () => {
    try {
      const [s, eq, trends] = await Promise.all([
        api.stats.get(token!),
        api.stats.equivalents(token!),
        api.stats.trends(token!, 3),
      ]);
      setStats(s);
      setEquivalents(eq);
      setTrendData(trends);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadWeekData = async () => {
    const { start, end } = getWeekDates(weekOffset);
    try {
      const logs = await api.habitLogs.range(token!, start, end);
      setWeekLogs(logs);
    } catch {}
  };

  const loadCalendarData = async () => {
    const { start, end } = getMonthDates(calMonth.year, calMonth.month);
    try {
      const logs = await api.habitLogs.range(token!, start, end);
      setCalLogs(logs);
    } catch {}
  };

  // Chart data: aggregate calories saved per day for the week
  const chartData = useMemo(() => {
    const { days } = getWeekDates(weekOffset);
    return days.map((date) => {
      const dayLogs = weekLogs.filter((l) => l.date === date);
      const cal = dayLogs.reduce((sum, l) => sum + (l.savedCalories || 0), 0);
      const label = date.slice(5); // MM-DD
      return { date: label, kcal: Math.round(cal) };
    });
  }, [weekLogs, weekOffset]);

  // Calendar: build map of date -> total saved calories
  const calendarMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of calLogs) {
      if (!map[log.date]) map[log.date] = 0;
      map[log.date] += log.savedCalories || 0;
    }
    return map;
  }, [calLogs]);

  const calGrid = useMemo(
    () => getMonthDates(calMonth.year, calMonth.month),
    [calMonth.year, calMonth.month],
  );

  // Detect locale for day names
  const isRu = tc('kcal') === 'ккал';
  const dayLabels = isRu ? SHORT_DAYS_RU : SHORT_DAYS;

  const monthName = new Date(calMonth.year, calMonth.month).toLocaleDateString(
    isRu ? 'ru-RU' : 'en-US',
    { month: 'long', year: 'numeric' },
  );

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

  const today = new Date().toISOString().split('T')[0];

  return (
    <AppShell>
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-6">{t('yourProgress')}</h1>

      {/* Big stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <BigStat
          icon={<Zap className="w-6 h-6 text-warning" />}
          value={Math.round(stats.totalSavedCalories).toLocaleString()}
          unit={tc('kcal')}
          label={t('caloriesSaved')}
          bgColor="bg-warning/10"
        />
        <BigStat
          icon={<DollarSign className="w-6 h-6 text-success" />}
          value={`${({EUR:'€',USD:'$',GBP:'£',PLN:'zł',UAH:'₴',RUB:'₽'})[user?.currency||'EUR']||'€'}${stats.totalSavedMoney.toFixed(2)}`}
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

      {/* Weekly Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            {t('weeklyChart')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-primary font-medium px-2"
              disabled={weekOffset === 0}
            >
              {t('thisWeek')}
            </button>
            <button
              onClick={() => setWeekOffset((p) => Math.min(p + 1, 0))}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val} ${tc('kcal')}`, t('caloriesSaved')]}
              />
              <Bar dataKey="kcal" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend Line Chart */}
      {trendData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
              {t('monthlyTrend')}
            </h2>
            {trendData.length > 0 && (
              <span className="text-xs text-[var(--muted)]">
                {t('weeklyAverage')}:{' '}
                <span className="font-semibold text-[var(--foreground)]">
                  {Math.round(
                    trendData.reduce((s, d) => s + d.savedCalories, 0) / trendData.length,
                  ).toLocaleString()}{' '}
                  {tc('kcal')}
                </span>
              </span>
            )}
          </div>
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${Math.round(val)} ${tc('kcal')}`, t('caloriesSaved')]}
                />
                <Line
                  type="monotone"
                  dataKey="savedCalories"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Calendar Heatmap */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            {t('calendar')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCalMonth((p) => {
                  const d = new Date(p.year, p.month - 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-[var(--foreground)] min-w-[120px] text-center capitalize">
              {monthName}
            </span>
            <button
              onClick={() =>
                setCalMonth((p) => {
                  const d = new Date(p.year, p.month + 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayLabels.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-[var(--muted)]">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calGrid.cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const day = parseInt(date.slice(-2), 10);
              const kcal = calendarMap[date] ?? 0;
              const isToday = date === today;
              const hasData = date in calendarMap;

              // 5-level intensity based on saved calories
              let bgStyle = 'bg-[var(--background)]';
              if (hasData) {
                if (kcal >= 500) {
                  bgStyle = 'bg-green-500'; // Level 4: full green
                } else if (kcal >= 300) {
                  bgStyle = 'bg-green-500/70'; // Level 3: strong green
                } else if (kcal >= 100) {
                  bgStyle = 'bg-green-500/40'; // Level 2: medium green
                } else {
                  bgStyle = 'bg-green-500/20'; // Level 1: light green
                }
              }

              return (
                <div
                  key={date}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all ${bgStyle} ${
                    isToday ? 'ring-2 ring-primary' : ''
                  }`}
                  title={hasData ? `${Math.round(kcal)} ${tc('kcal')}` : ''}
                >
                  {day}
                </div>
              );
            })}
          </div>
          {/* Gradient legend */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-[10px] text-[var(--muted)] mr-1">{t('less')}</span>
            <div className="w-3 h-3 rounded bg-[var(--background)] border border-[var(--border)]" />
            <div className="w-3 h-3 rounded bg-green-500/20" />
            <div className="w-3 h-3 rounded bg-green-500/40" />
            <div className="w-3 h-3 rounded bg-green-500/70" />
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-[10px] text-[var(--muted)] ml-1">{t('more')}</span>
          </div>
        </div>
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
