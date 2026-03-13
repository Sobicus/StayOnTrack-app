'use client';

import { useTranslations } from 'next-intl';

interface SparklineDay {
  date: string;
  status: string | null;
}

interface HabitSparklineProps {
  days: SparklineDay[];
}

const STATUS_COLORS: Record<string, string> = {
  AVOIDED: 'bg-success',
  PARTIAL: 'bg-warning',
  CONSUMED: 'bg-danger',
};

export function HabitSparkline({ days }: HabitSparklineProps) {
  const t = useTranslations('habits');

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[var(--muted)] mr-0.5">{t('last7Days')}</span>
      {days.map((day) => (
        <span
          key={day.date}
          className={`w-[6px] h-[6px] rounded-full ${
            day.status ? STATUS_COLORS[day.status] || 'bg-[var(--muted)]/30' : 'bg-[var(--muted)]/30'
          }`}
          title={`${day.date}: ${day.status || '-'}`}
        />
      ))}
    </div>
  );
}
