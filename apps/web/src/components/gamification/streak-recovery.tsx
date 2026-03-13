'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { api, ApiError } from '@/lib/api';
import { Flame, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StreakRecoveryProps {
  /** Current XP the user has */
  currentXp: number;
  /** Callback after successful recovery */
  onRecovered?: () => void;
  /** Callback to dismiss the banner */
  onDismiss?: () => void;
}

const RECOVERY_COST = 200;

export function StreakRecovery({ currentXp, onRecovered, onDismiss }: StreakRecoveryProps) {
  const { token } = useAuth();
  const t = useTranslations('streakRecovery');
  const [loading, setLoading] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEnoughXp = currentXp >= RECOVERY_COST;

  const handleRecover = async () => {
    if (!token || !hasEnoughXp) return;
    setLoading(true);
    setError(null);

    try {
      await api.streaks.recover(token);
      setRecovered(true);
      onRecovered?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.messages[0]);
      } else {
        setError(t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (recovered) {
    return (
      <div className="rounded-2xl p-4 mb-6 border border-success/30 bg-success/10 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-success">{t('success')}</p>
            <p className="text-xs text-[var(--muted)]">
              {t('xpSpent', { xp: RECOVERY_COST })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 mb-6 border border-warning/30 bg-warning/10">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">{t('title')}</p>
          <p className="text-xs text-[var(--muted)]">{t('description')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Zap className="w-3.5 h-3.5" />
          <span>{t('cost', { xp: RECOVERY_COST })}</span>
          <span className="text-[var(--muted)]/60">
            ({t('youHave', { xp: currentXp })})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {t('dismiss')}
            </button>
          )}
          <button
            onClick={handleRecover}
            disabled={loading || !hasEnoughXp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-warning text-white hover:bg-warning/90 active:scale-95"
          >
            <Flame className="w-3.5 h-3.5" />
            {loading ? t('recovering') : hasEnoughXp ? t('recover') : t('insufficientXp')}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-danger mt-2">{error}</p>
      )}
    </div>
  );
}
