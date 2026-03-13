/** Approximate kcal required to gain/lose 1 kg of body fat */
export const FAT_KG_PER_KCAL = 7700;

/** Default user weight in kg, used when the user hasn't set their weight */
export const DEFAULT_WEIGHT_KG = 75;

/** Default currency code */
export const DEFAULT_CURRENCY = 'EUR';

/** Number of streak shields granted per week */
export const STREAK_SHIELDS_PER_WEEK = 1;

/** XP cost to recover a broken streak */
export const STREAK_RECOVERY_XP_COST = 200;

/**
 * Portion ratio threshold for partial success.
 * A portionRatio <= this value counts as a streak success.
 */
export const PARTIAL_SUCCESS_THRESHOLD = 0.5;

/** Currently supported locales */
export const SUPPORTED_LOCALES = ['en', 'ru'] as const;

// ── XP & Level System ──────────────────────────────────────────────

/** XP rewards for various actions */
export const XP_REWARDS = {
  CHECK_IN: 10,
  FULL_DAY_AVOIDED: 25,
  QUEST_COMPLETE: 50,
  STREAK_MILESTONE: 100,
} as const;

/**
 * Cumulative XP needed for each level.
 * Index = level number, value = total XP required.
 * Level 1 starts at 0 XP.
 */
export const LEVEL_THRESHOLDS: number[] = [
  0,      // level 0 (unused)
  0,      // level 1
  100,    // level 2
  250,    // level 3
  500,    // level 4
  1000,   // level 5
  2000,   // level 6
  3500,   // level 7
  5500,   // level 8
  8000,   // level 9
  11000,  // level 10
  15000,  // level 11
  20000,  // level 12
  26000,  // level 13
  33000,  // level 14
  41000,  // level 15
  50000,  // level 16
];

/** Returns the current level for a given XP total */
export function getLevel(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 1; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  return level;
}

/** Returns level info with progress towards the next level */
export function getXpForNextLevel(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const level = getLevel(xp);
  const currentLevelXp = LEVEL_THRESHOLDS[level] ?? 0;

  // If at max level, progress is 100%
  if (level >= LEVEL_THRESHOLDS.length - 1) {
    return {
      level,
      currentXp: xp,
      nextLevelXp: currentLevelXp,
      progress: 1,
    };
  }

  const nextLevelXp = LEVEL_THRESHOLDS[level + 1];
  const xpIntoLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progress = xpNeeded > 0 ? Math.min(xpIntoLevel / xpNeeded, 1) : 1;

  return {
    level,
    currentXp: xp,
    nextLevelXp,
    progress: Math.round(progress * 100) / 100,
  };
}
