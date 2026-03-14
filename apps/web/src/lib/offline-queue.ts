const STORAGE_KEY = 'stayontrack_pending_checkins';

export interface PendingCheckin {
  habitId: string;
  date?: string;
  portionRatio: number;
  timestamp: number;
}

export function addPendingCheckin(checkin: PendingCheckin): void {
  const pending = getPendingCheckins();
  pending.push(checkin);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  }
}

export function getPendingCheckins(): PendingCheckin[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingCheckin[];
  } catch {
    return [];
  }
}

export function removePendingCheckin(timestamp: number): void {
  const pending = getPendingCheckins().filter((c) => c.timestamp !== timestamp);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  }
}

export function clearPendingCheckins(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasPendingCheckins(): boolean {
  return getPendingCheckins().length > 0;
}
