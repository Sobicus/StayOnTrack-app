'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  const handleChange = (newLocale: Locale) => {
    // Set cookie and reload to apply new locale
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg bg-[var(--background)] p-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleChange(locale)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentLocale === locale
              ? 'bg-primary text-white'
              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
