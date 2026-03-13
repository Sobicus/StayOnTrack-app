'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { Zap, DollarSign, Scale } from 'lucide-react';

interface LiveStats {
  pastCalories: number;
  pastMoney: number;
  pastWeightKg: number;
  todayCalories: number;
  todayMoney: number;
  todayExpectedCalories: number;
  todayExpectedMoney: number;
  startedAt: string;
  dayEndHour: number;
}

type MetricKey = 'calories' | 'money' | 'weight';

const METRIC_CONFIG: Record<
  MetricKey,
  {
    icon: typeof Zap;
    cssColor: string;
    textColor: string;
    glowClass: string;
    ringClass: string;
    sparkleColor: string;
  }
> = {
  calories: {
    icon: Zap,
    cssColor: 'rgba(251,191,36,0.8)',
    textColor: 'text-amber-400',
    glowClass: 'glow-calories',
    ringClass: 'ring-calories',
    sparkleColor: '#fbbf24',
  },
  money: {
    icon: DollarSign,
    cssColor: 'rgba(34,197,94,0.8)',
    textColor: 'text-emerald-400',
    glowClass: 'glow-money',
    ringClass: 'ring-money',
    sparkleColor: '#22c55e',
  },
  weight: {
    icon: Scale,
    cssColor: 'rgba(168,85,247,0.8)',
    textColor: 'text-purple-400',
    glowClass: 'glow-weight',
    ringClass: 'ring-weight',
    sparkleColor: '#a855f7',
  },
};

const METRICS: MetricKey[] = ['calories', 'money', 'weight'];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  PLN: 'zł',
  UAH: '₴',
  RUB: '₽',
};

export function LiveHero() {
  const { token, user } = useAuth();
  const t = useTranslations('dashboard');
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('calories');
  const [interpolated, setInterpolated] = useState({ calories: 0, money: 0, weight: 0 });
  const [dayProgress, setDayProgress] = useState(0);
  const [elapsedLabel, setElapsedLabel] = useState('00:00:00');
  const frameRef = useRef<number>(0);
  const statsRef = useRef<LiveStats | null>(null);

  // Fetch live stats
  useEffect(() => {
    if (!token) return;
    api.stats
      .live(token)
      .then((data: LiveStats) => {
        setLiveStats(data);
        statsRef.current = data;
      })
      .catch(() => {});
  }, [token]);

  const getDayBounds = useCallback((dayEndHour: number) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(dayEndHour, 0, 0, 0);
    if (now < todayStart) {
      todayStart.setDate(todayStart.getDate() - 1);
    }
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    return { todayStart, todayEnd };
  }, []);

  const tick = useCallback(() => {
    const stats = statsRef.current;
    if (!stats) {
      frameRef.current = requestAnimationFrame(tick);
      return;
    }

    const now = new Date();
    const { todayStart, todayEnd } = getDayBounds(stats.dayEndHour);
    const dayLengthMs = todayEnd.getTime() - todayStart.getTime();
    const elapsedMs = Math.max(0, now.getTime() - todayStart.getTime());
    const progress = Math.min(elapsedMs / dayLengthMs, 1);

    const todayCal = stats.todayCalories * progress;
    const todayMon = stats.todayMoney * progress;
    const todayWeight = todayCal / 7700;

    setInterpolated({
      calories: stats.pastCalories + todayCal,
      money: stats.pastMoney + todayMon,
      weight: stats.pastWeightKg + todayWeight,
    });
    setDayProgress(progress);

    const totalSec = Math.floor(elapsedMs / 1000);
    const h = Math.floor(totalSec / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    setElapsedLabel(`${h}:${m}:${s}`);

    frameRef.current = requestAnimationFrame(tick);
  }, [getDayBounds]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [tick]);

  // SVG circle params
  const SIZE = 200;
  const STROKE = 6;
  const RADIUS = (SIZE - STROKE * 2) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE * (1 - dayProgress);

  // Glow dot position — angle from top (12 o'clock), clockwise
  const angle = dayProgress * 2 * Math.PI - Math.PI / 2; // -90° offset because arc starts at top
  const dotX = SIZE / 2 + RADIUS * Math.cos(angle);
  const dotY = SIZE / 2 + RADIUS * Math.sin(angle);

  const config = METRIC_CONFIG[activeMetric];
  const Icon = config.icon;

  const formatValue = (metric: MetricKey): string => {
    switch (metric) {
      case 'calories':
        return Math.round(interpolated.calories).toLocaleString();
      case 'money': {
        const sym = CURRENCY_SYMBOLS[user?.currency || 'EUR'] || '€';
        return `${sym}${interpolated.money.toFixed(2)}`;
      }
      case 'weight':
        return `${interpolated.weight.toFixed(3)}`;
    }
  };

  const formatUnit = (metric: MetricKey): string => {
    switch (metric) {
      case 'calories':
        return 'kcal';
      case 'money':
        return t('liveHero.saved');
      case 'weight':
        return 'kg';
    }
  };

  if (!liveStats) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-[220px] h-[220px] rounded-full bg-[var(--card)] border border-[var(--border)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mb-6">
      {/* ===== Neon Ring Container ===== */}
      <div className="live-hero-container">
        {/* Layer 1: Radial glow background */}
        <div className={`live-hero-glow-layer ${config.glowClass}`} />

        {/* Layer 2: Rotating conic-gradient ring */}
        <div className={`live-hero-ring ${config.ringClass}`} />

        {/* Layer 3: Sparkles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="live-hero-sparkle"
            style={{ backgroundColor: config.sparkleColor }}
          />
        ))}

        {/* Layer 4: SVG Progress Arc */}
        <div className="absolute inset-[10px] z-[5]">
          <svg
            width={SIZE}
            height={SIZE}
            className="live-hero-progress-glow"
            style={{ '--hero-color': config.cssColor } as React.CSSProperties}
          >
            {/* Track circle (dim) */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth={STROKE}
              strokeOpacity={0.3}
              className="transform -rotate-90 origin-center"
            />
            {/* Active progress arc */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={config.cssColor}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transform -rotate-90 origin-center transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
            {/* Glow dot at progress leading edge */}
            <defs>
              <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx={dotX}
              cy={dotY}
              r={5}
              fill={config.cssColor}
              filter="url(#dot-glow)"
              className="live-hero-dot-pulse"
            />
          </svg>
        </div>

        {/* Layer 5: Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <Icon className={`w-5 h-5 ${config.textColor} mb-1 drop-shadow-lg`} />
          <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums leading-tight drop-shadow-sm">
            {formatValue(activeMetric)}
          </p>
          <p className="text-xs text-[var(--muted)]">{formatUnit(activeMetric)}</p>
          <p className="text-[10px] text-[var(--muted)] tabular-nums mt-1.5 font-mono opacity-70">
            {elapsedLabel}
          </p>
        </div>
      </div>

      {/* Metric switcher pills */}
      <div className="flex items-center gap-2 mt-5">
        {METRICS.map((m) => {
          const MIcon = METRIC_CONFIG[m].icon;
          const isActive = activeMetric === m;
          return (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? `${METRIC_CONFIG[m].textColor} bg-[var(--card)] shadow-lg border border-[var(--border)]`
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <MIcon className="w-3.5 h-3.5" />
              {t(`liveHero.${m}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
