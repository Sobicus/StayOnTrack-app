export const locales = ['en', 'ru', 'uk', 'fr', 'es', 'de', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  pt: 'Português',
};
