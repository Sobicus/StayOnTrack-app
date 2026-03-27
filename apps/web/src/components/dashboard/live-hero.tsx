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
    sparkleColor: string;
    /** Conic gradient for the rotating ring ::before */
    ringGradient: string;
    /** Radial gradient background for outer glow */
    glowBg: string;
    /** Box-shadow for outer glow */
    glowShadow: string;
  }
> = {
  calories: {
    icon: Zap,
    cssColor: 'rgba(251,191,36,0.8)',
    textColor: 'text-amber-400',
    sparkleColor: '#fbbf24',
    ringGradient:
      'conic-gradient(from 0deg, rgba(251,191,36,0.05), rgba(251,191,36,0.9), rgba(245,158,11,0.6), rgba(251,191,36,0.05), rgba(251,191,36,0.8), rgba(251,191,36,0.05))',
    glowBg:
      'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)',
    glowShadow:
      '0 0 30px 8px rgba(251,191,36,0.2), 0 0 60px 20px rgba(251,191,36,0.1)',
  },
  money: {
    icon: DollarSign,
    cssColor: 'rgba(34,197,94,0.8)',
    textColor: 'text-emerald-400',
    sparkleColor: '#22c55e',
    ringGradient:
      'conic-gradient(from 0deg, rgba(34,197,94,0.05), rgba(34,197,94,0.9), rgba(22,163,74,0.6), rgba(34,197,94,0.05), rgba(34,197,94,0.8), rgba(34,197,94,0.05))',
    glowBg:
      'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)',
    glowShadow:
      '0 0 30px 8px rgba(34,197,94,0.2), 0 0 60px 20px rgba(34,197,94,0.1)',
  },
  weight: {
    icon: Scale,
    cssColor: 'rgba(168,85,247,0.8)',
    textColor: 'text-purple-400',
    sparkleColor: '#a855f7',
    ringGradient:
      'conic-gradient(from 0deg, rgba(99,102,241,0.05), rgba(168,85,247,0.9), rgba(99,102,241,0.6), rgba(139,92,246,0.05), rgba(168,85,247,0.8), rgba(99,102,241,0.05))',
    glowBg:
      'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
    glowShadow:
      '0 0 30px 8px rgba(99,102,241,0.2), 0 0 60px 20px rgba(99,102,241,0.1)',
  },
};

const METRICS: MetricKey[] = ['calories', 'money', 'weight'];

/** Sparkle positions & animations — inline so no CSS dependency */
const SPARKLE_STYLES: React.CSSProperties[] = [
  { top: '8%', left: '20%', animation: 'sparkle-1 2.5s ease-in-out infinite' },
  { top: '15%', right: '12%', animation: 'sparkle-2 3s ease-in-out infinite 0.5s' },
  { bottom: '18%', left: '15%', animation: 'sparkle-3 2.8s ease-in-out infinite 1s' },
  { bottom: '10%', right: '20%', animation: 'sparkle-1 3.2s ease-in-out infinite 1.5s' },
  { top: '50%', left: '2%', animation: 'sparkle-2 2.6s ease-in-out infinite 0.8s' },
];

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
      {/* ===== Neon Ring Container — ALL STYLES INLINE, NO CSS CLASS DEPS ===== */}
      <div data-ring-v="3" style={{ position: 'relative', width: 220, height: 220 }}>
        {/* Layer 1: Radial glow background */}
        <div
          style={{
            position: 'absolute',
            inset: -12,
            borderRadius: '50%',
            background: config.glowBg,
            boxShadow: config.glowShadow,
            animation: 'hero-pulse 3s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Layer 2: Rotating conic-gradient ring (real divs, not pseudo-elements) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
          {/* Spinning gradient — replaces ::before */}
          <div
            style={{
              position: 'absolute',
              inset: '-50%',
              borderRadius: '50%',
              background: config.ringGradient,
              animation: 'hero-ring-spin 6s linear infinite',
            }}
          />
          {/* Center cutout — replaces ::after */}
          <div
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: '50%',
              background: 'var(--background)',
              zIndex: 1,
            }}
          />
        </div>

        {/* Layer 3: Sparkles */}
        {SPARKLE_STYLES.map((sp, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              borderRadius: '50%',
              pointerEvents: 'none',
              backgroundColor: config.sparkleColor,
              ...sp,
            }}
          />
        ))}

        {/* Layer 4: SVG Progress Arc */}
        <div style={{ position: 'absolute', inset: 10, zIndex: 5 }}>
          <svg
            width={SIZE}
            height={SIZE}
            style={{
              filter: `drop-shadow(0 0 4px ${config.cssColor}) drop-shadow(0 0 10px ${config.cssColor.replace('0.8', '0.4')})`,
            }}
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
              style={{ animation: 'dot-pulse 1.5s ease-in-out infinite' }}
            />
          </svg>
        </div>

        {/* Layer 5: Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
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
