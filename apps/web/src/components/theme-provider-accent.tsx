'use client';

import { useEffect } from 'react';
import { getAccentColor, ACCENT_THEME_KEY } from '@/lib/themes';

export function AccentThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply saved accent color on mount
    const color = getAccentColor();
    document.documentElement.style.setProperty('--accent-color', color);

    // Listen for storage changes (e.g., from other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ACCENT_THEME_KEY) {
        const updated = getAccentColor();
        document.documentElement.style.setProperty('--accent-color', updated);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return <>{children}</>;
}
