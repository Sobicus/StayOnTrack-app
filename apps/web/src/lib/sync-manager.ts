import { api, ApiError } from '@/lib/api';
import {
  getPendingCheckins,
  removePendingCheckin,
  PendingCheckin,
} from '@/lib/offline-queue';

function statusFromPortionRatio(portionRatio: number): string {
  if (portionRatio === 0) return 'AVOIDED';
  if (portionRatio >= 1) return 'CONSUMED';
  return 'PARTIAL';
}

export async function syncPendingCheckins(
  token: string,
): Promise<{ synced: number; failed: number }> {
  const pending = getPendingCheckins();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const checkin of pending) {
    try {
      await api.habitLogs.checkin(token, {
        habitId: checkin.habitId,
        status: statusFromPortionRatio(checkin.portionRatio),
        portionRatio: checkin.portionRatio,
        date: checkin.date,
      });
      removePendingCheckin(checkin.timestamp);
      synced++;
    } catch (err) {
      // If the server explicitly rejects (e.g. duplicate), remove from queue
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        removePendingCheckin(checkin.timestamp);
        synced++; // treat client-error removals as handled
      } else {
        failed++;
      }
    }
  }

  return { synced, failed };
}

export function setupAutoSync(token: string): () => void {
  const handler = () => {
    syncPendingCheckins(token);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handler);
  }

  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handler);
    }
  };
}
