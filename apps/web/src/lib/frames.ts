/** Profile avatar frame definitions. */

export interface ProfileFrame {
  id: string;
  name: string;
  /** CSS gradient string for the ring */
  gradient: string;
  /** Optional glow color for box-shadow */
  glowColor?: string;
  /** Animation type */
  animation: 'none' | 'spin' | 'pulse' | 'spin-pulse';
  /** Speed of spin in seconds (only for spin/spin-pulse) */
  spinSpeed?: number;
  /** Achievement ID required to unlock. null = always available. */
  unlockAchievementId: string | null;
  /** Human-readable unlock hint */
  unlockHint: string;
  /** Visual tier (1-5) — affects ring thickness */
  tier: 1 | 2 | 3 | 4 | 5;
}

export const FRAMES: ProfileFrame[] = [
  {
    id: 'none',
    name: 'No Frame',
    gradient: 'transparent',
    animation: 'none',
    unlockAchievementId: null,
    unlockHint: 'Always available',
    tier: 1,
  },
  // ── Tier 1 — Silver / Gold ────────────────────────────────────────────────
  {
    id: 'steel',
    name: 'Steel',
    gradient: 'conic-gradient(from 0deg, #9CA3AF, #E5E7EB, #6B7280, #E5E7EB, #9CA3AF)',
    animation: 'none',
    unlockAchievementId: 'checkin-10',
    unlockHint: '10 check-ins',
    tier: 1,
  },
  {
    id: 'gold',
    name: 'Gold',
    gradient: 'conic-gradient(from 0deg, #B45309, #FCD34D, #D97706, #FEF3C7, #B45309)',
    animation: 'none',
    unlockAchievementId: 'checkin-100',
    unlockHint: '100 check-ins',
    tier: 2,
  },
  // ── Tier 2 — Elemental ───────────────────────────────────────────────────
  {
    id: 'fire',
    name: 'Fire',
    gradient: 'conic-gradient(#7F1D1D, #EF4444, #F97316, #FDE047, #F97316, #EF4444, #7F1D1D)',
    glowColor: 'rgba(239,68,68,0.45)',
    animation: 'spin',
    spinSpeed: 4,
    unlockAchievementId: 'cal-5k',
    unlockHint: '5,000 kcal saved',
    tier: 2,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'conic-gradient(from 0deg, #0369A1, #22D3EE, #7DD3FC, #0EA5E9, #0369A1)',
    animation: 'none',
    unlockAchievementId: 'streak-14',
    unlockHint: '14-day streak',
    tier: 2,
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'conic-gradient(from 0deg, #065F46, #34D399, #6EE7B7, #059669, #065F46)',
    animation: 'none',
    unlockAchievementId: 'streak-30',
    unlockHint: '30-day streak',
    tier: 2,
  },
  // ── Tier 3 — Advanced ────────────────────────────────────────────────────
  {
    id: 'aurora',
    name: 'Aurora',
    gradient: 'conic-gradient(from 0deg, #00FF87, #60EFFF, #A855F7, #EC4899, #00FF87)',
    glowColor: 'rgba(96,239,255,0.4)',
    animation: 'spin',
    spinSpeed: 6,
    unlockAchievementId: 'streak-60',
    unlockHint: '60-day streak',
    tier: 3,
  },
  {
    id: 'crimson',
    name: 'Crimson',
    gradient: 'conic-gradient(from 0deg, #450A0A, #DC2626, #F87171, #DC2626, #450A0A)',
    glowColor: 'rgba(220,38,38,0.5)',
    animation: 'spin',
    spinSpeed: 5,
    unlockAchievementId: 'challenge-win',
    unlockHint: 'Win a challenge',
    tier: 3,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    gradient: 'conic-gradient(from 0deg, #1E1B4B, #6D28D9, #2563EB, #7C3AED, #312E81, #1E1B4B)',
    glowColor: 'rgba(109,40,217,0.5)',
    animation: 'spin',
    spinSpeed: 7,
    unlockAchievementId: 'streak-100',
    unlockHint: '100-day streak',
    tier: 3,
  },
  // ── Tier 4 — Elite ───────────────────────────────────────────────────────
  {
    id: 'neon',
    name: 'Neon',
    gradient: 'conic-gradient(#FF00FF, #00FFFF, #FF00FF, #00FFFF, #FF00FF)',
    glowColor: 'rgba(255,0,255,0.6)',
    animation: 'spin',
    spinSpeed: 3,
    unlockAchievementId: 'challenge-3wins',
    unlockHint: 'Win 3 challenges',
    tier: 4,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    gradient: 'conic-gradient(from 0deg, #BAE6FD, #FFFFFF, #93C5FD, #FFFFFF, #BAE6FD)',
    glowColor: 'rgba(186,230,253,0.7)',
    animation: 'spin',
    spinSpeed: 4,
    unlockAchievementId: 'money-500',
    unlockHint: '€500 saved',
    tier: 4,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    gradient: 'conic-gradient(red, orange, yellow, green, cyan, blue, violet, red)',
    animation: 'spin',
    spinSpeed: 3,
    unlockAchievementId: 'checkin-500',
    unlockHint: '500 check-ins',
    tier: 4,
  },
  // ── Tier 5 — Legendary ───────────────────────────────────────────────────
  {
    id: 'legend',
    name: 'Legend',
    gradient: 'conic-gradient(from 0deg, #78350F, #F59E0B, #FEF3C7, #FBBF24, #F59E0B, #78350F)',
    glowColor: 'rgba(251,191,36,0.7)',
    animation: 'spin-pulse',
    spinSpeed: 4,
    unlockAchievementId: 'streak-365',
    unlockHint: '365-day streak',
    tier: 5,
  },
];

export const FRAME_KEY = 'profile-frame';

export function getFrameById(id: string | null | undefined): ProfileFrame {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0];
}

/** Returns ring width in px based on tier */
export function getFrameWidth(tier: number): number {
  if (tier >= 5) return 5;
  if (tier >= 4) return 4;
  if (tier >= 3) return 4;
  return 3;
}
