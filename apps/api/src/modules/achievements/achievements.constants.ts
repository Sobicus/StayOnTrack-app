/**
 * Achievement definitions for StayOnTrack.
 * Achievements are calculated dynamically from user stats — no DB table needed.
 *
 * Categories:
 * - CALORIES: based on total saved calories (7700 kcal ≈ 1 kg not gained)
 * - STREAK: based on current/best streak days
 * - CHECKINS: based on total check-ins
 * - MONEY: based on total money saved
 */

export interface AchievementDef {
  id: string;
  category: 'CALORIES' | 'STREAK' | 'CHECKINS' | 'MONEY';
  title: string;
  description: string;
  emoji: string;
  threshold: number;
  /** What the threshold measures */
  unit: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // === CALORIES (potential weight not gained) ===
  // 7700 kcal ≈ 1 kg of body fat
  { id: 'cal-1k', category: 'CALORIES', title: 'First Steps', description: 'Saved your first 1,000 calories', emoji: '🌱', threshold: 1000, unit: 'kcal' },
  { id: 'cal-5k', category: 'CALORIES', title: 'Getting Warmer', description: 'Saved 5,000 calories', emoji: '🔥', threshold: 5000, unit: 'kcal' },
  { id: 'cal-1kg', category: 'CALORIES', title: '1 kg Not Gained', description: 'Avoided ~1 kg of potential weight (7,700 kcal)', emoji: '🏅', threshold: 7700, unit: 'kcal' },
  { id: 'cal-3kg', category: 'CALORIES', title: '3 kg Not Gained', description: 'Avoided ~3 kg of potential weight (23,100 kcal)', emoji: '🥈', threshold: 23100, unit: 'kcal' },
  { id: 'cal-5kg', category: 'CALORIES', title: '5 kg Not Gained', description: 'Avoided ~5 kg of potential weight (38,500 kcal)', emoji: '🥇', threshold: 38500, unit: 'kcal' },
  { id: 'cal-10kg', category: 'CALORIES', title: '10 kg Not Gained', description: 'Avoided ~10 kg of potential weight (77,000 kcal)', emoji: '💎', threshold: 77000, unit: 'kcal' },
  { id: 'cal-25kg', category: 'CALORIES', title: '25 kg Not Gained', description: 'Avoided ~25 kg of potential weight', emoji: '👑', threshold: 192500, unit: 'kcal' },
  { id: 'cal-50kg', category: 'CALORIES', title: '50 kg Not Gained', description: 'Avoided ~50 kg — legendary willpower!', emoji: '🏆', threshold: 385000, unit: 'kcal' },

  // === STREAK ===
  { id: 'streak-3', category: 'STREAK', title: 'Hat Trick', description: '3-day streak', emoji: '⚡', threshold: 3, unit: 'days' },
  { id: 'streak-7', category: 'STREAK', title: 'One Week Strong', description: '7-day streak', emoji: '🗓️', threshold: 7, unit: 'days' },
  { id: 'streak-14', category: 'STREAK', title: 'Two Weeks Clean', description: '14-day streak', emoji: '💪', threshold: 14, unit: 'days' },
  { id: 'streak-30', category: 'STREAK', title: 'Monthly Champion', description: '30-day streak', emoji: '🌟', threshold: 30, unit: 'days' },
  { id: 'streak-60', category: 'STREAK', title: 'Unstoppable', description: '60-day streak', emoji: '🚀', threshold: 60, unit: 'days' },
  { id: 'streak-100', category: 'STREAK', title: 'Century Club', description: '100-day streak', emoji: '💯', threshold: 100, unit: 'days' },
  { id: 'streak-365', category: 'STREAK', title: 'Full Year', description: '365-day streak — true master!', emoji: '🎖️', threshold: 365, unit: 'days' },

  // === CHECK-INS ===
  { id: 'checkin-1', category: 'CHECKINS', title: 'First Check-in', description: 'Completed your first check-in', emoji: '✅', threshold: 1, unit: 'check-ins' },
  { id: 'checkin-10', category: 'CHECKINS', title: 'Getting Consistent', description: '10 check-ins completed', emoji: '📋', threshold: 10, unit: 'check-ins' },
  { id: 'checkin-50', category: 'CHECKINS', title: 'Habit Former', description: '50 check-ins completed', emoji: '🎯', threshold: 50, unit: 'check-ins' },
  { id: 'checkin-100', category: 'CHECKINS', title: 'Centurion', description: '100 check-ins completed', emoji: '🏛️', threshold: 100, unit: 'check-ins' },
  { id: 'checkin-500', category: 'CHECKINS', title: 'Dedicated', description: '500 check-ins completed', emoji: '⭐', threshold: 500, unit: 'check-ins' },

  // === MONEY ===
  { id: 'money-10', category: 'MONEY', title: 'First Savings', description: 'Saved €10', emoji: '💰', threshold: 10, unit: '€' },
  { id: 'money-50', category: 'MONEY', title: 'Fifty Saved', description: 'Saved €50', emoji: '💵', threshold: 50, unit: '€' },
  { id: 'money-100', category: 'MONEY', title: 'Triple Digits', description: 'Saved €100', emoji: '🤑', threshold: 100, unit: '€' },
  { id: 'money-500', category: 'MONEY', title: 'Half Grand', description: 'Saved €500', emoji: '💎', threshold: 500, unit: '€' },
  { id: 'money-1000', category: 'MONEY', title: 'Thousand Saver', description: 'Saved €1,000!', emoji: '🏦', threshold: 1000, unit: '€' },
];
