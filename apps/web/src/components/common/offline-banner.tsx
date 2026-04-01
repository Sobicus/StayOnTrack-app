'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { hasPendingCheckins, getPendingCheckins } from '@/lib/offline-queue';
import { syncPendingCheckins } from '@/lib/sync-manager';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

type BannerState = 'hidden' | 'offline' | 'syncing' | 'synced';

export function OfflineBanner() {
  const [state, setState] = useState<BannerState>('hidden');
  const [pendingCount, setPendingCount] = useState(0);
  const { token } = useAuth();
  const t = useTranslations('common');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial state
    if (!navigator.onLine) {
      setState('offline');
      setPendingCount(getPendingCheckins().length);
    }

    const handleOffline = () => {
      setState('offline');
      setPendingCount(getPendingCheckins().length);
    };

    const handleOnline = async () => {
      if (hasPendingCheckins() && token) {
        const count = getPendingCheckins().length;
        setPendingCount(count);
        setState('syncing');

        await syncPendingCheckins(token);

        setState('synced');
        setTimeout(() => setState('hidden'), 2500);
      } else {
        setState('hidden');
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [token]);

  // Also update pending count periodically when offline
  useEffect(() => {
    if (state !== 'offline') return;
    const interval = setInterval(() => {
      setPendingCount(getPendingCheckins().length);
    }, 2000);
    return () => clearInterval(interval);
  }, [state]);

  if (state === 'hidden') return null;

  return (
    <div
      className={`w-full px-4 py-2.5 text-sm font-medium text-center flex items-center justify-center gap-2 transition-all ${
        state === 'offline'
          ? 'bg-warning/15 text-warning border-b border-warning/20'
          : state === 'syncing'
            ? 'bg-primary/15 text-primary border-b border-primary/20'
            : 'bg-success/15 text-success border-b border-success/20'
      }`}
    >
      {state === 'offline' && (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            {t('offline')}
            {pendingCount > 0 && ` (${pendingCount})`}
          </span>
        </>
      )}
      {state === 'syncing' && (
        <>
          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
          <span>{t('syncPending', { count: pendingCount })}</span>
        </>
      )}
      {state === 'synced' && (
        <>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{t('synced')}</span>
        </>
      )}
    </div>
  );
}
