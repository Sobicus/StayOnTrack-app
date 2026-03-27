import { CURRENCY_SYMBOLS } from '@stayontrack/contracts';

/**
 * Format a money amount with the appropriate currency symbol.
 */
export function formatMoney(amount: number, currency: string = 'EUR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '\u20ac';
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format a weight value in the user's preferred unit system.
 */
export function formatWeight(kg: number, unitSystem: string = 'metric'): string {
  if (unitSystem === 'imperial') {
    return `${(kg * 2.20462).toFixed(2)} lbs`;
  }
  return `${kg.toFixed(3)} kg`;
}
