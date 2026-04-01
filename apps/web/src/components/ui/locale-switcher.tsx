'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { ChevronDown } from 'lucide-react';

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  const handleChange = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    router.refresh();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] cursor-pointer">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {localeNames[currentLocale]}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
        <select
          value={currentLocale}
          onChange={(e) => handleChange(e.target.value as Locale)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          aria-label="Select language"
        >
          {locales.map((locale) => (
            <option key={locale} value={locale}>
              {localeNames[locale]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
