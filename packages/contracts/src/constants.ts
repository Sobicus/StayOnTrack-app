/** Approximate kcal required to gain/lose 1 kg of body fat */
export const FAT_KG_PER_KCAL = 7700;

/** Default user weight in kg, used when the user hasn't set their weight */
export const DEFAULT_WEIGHT_KG = 75;

/** Default currency code */
export const DEFAULT_CURRENCY = 'EUR';

/** Number of streak shields granted per week */
export const STREAK_SHIELDS_PER_WEEK = 1;

/**
 * Portion ratio threshold for partial success.
 * A portionRatio <= this value counts as a streak success.
 */
export const PARTIAL_SUCCESS_THRESHOLD = 0.5;

/** Currently supported locales */
export const SUPPORTED_LOCALES = ['en', 'ru'] as const;
