'use client';

import { Flame, TrendingDown, Dumbbell, DollarSign } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const stats = [
  {
    label: 'Calories Saved',
    value: '1,240',
    unit: 'kcal',
    icon: Flame,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    label: 'Effort Equivalent',
    value: '45 min',
    unit: 'running',
    icon: Dumbbell,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    label: 'Money Saved',
    value: '$18.50',
    unit: 'this week',
    icon: DollarSign,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Weight Avoided',
    value: '0.16',
    unit: 'kg',
    icon: TrendingDown,
    color: 'text-streak',
    bg: 'bg-streak/10',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="text-sm font-medium text-[var(--muted)]">
          StayOnTrack
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-lg px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
            StayOnTrack
          </h1>
          <p className="mt-3 text-lg text-[var(--muted)]">
            Track what you avoided, not what you consumed
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl p-5 transition-colors',
                'bg-[var(--card)] border border-[var(--border)]',
                'hover:shadow-md'
              )}
            >
              <div className={cn('inline-flex rounded-xl p-2', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {stat.value}
                </div>
                <div className="text-xs text-[var(--muted)]">{stat.unit}</div>
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--muted)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-streak/10 px-4 py-2">
            <Flame className="h-5 w-5 text-streak" />
            <span className="text-sm font-semibold text-streak">
              3-day streak
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Keep going! Every small win adds up.
          </p>
        </div>
      </main>
    </div>
  );
}
