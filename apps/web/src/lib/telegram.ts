export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Telegram?.WebApp;
}

export function getTelegramWebApp(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).Telegram?.WebApp || null;
}

export function getTelegramInitData(): string | null {
  const webapp = getTelegramWebApp();
  return webapp?.initData || null;
}
