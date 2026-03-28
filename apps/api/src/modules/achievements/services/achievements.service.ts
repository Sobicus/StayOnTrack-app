import { Injectable } from '@nestjs/common';
import { StatsService, UserStatsResult } from '../../stats/stats.service';
import { StreaksService, StreakResult } from '../../streaks/streaks.service';
import { FriendsService } from '../../friends/services/friends.service';
import { ChallengesService } from '../../challenges/challenges.service';
import { ACHIEVEMENTS, AchievementDef } from '../achievements.constants';

export interface UserAchievement {
  id: string;
  category: string;
  title: string;
  description: string;
  emoji: string;
  threshold: number;
  unit: string;
  progress: number;
  unlocked: boolean;
  /** 0-100 percentage */
  progressPercent: number;
}

export interface AchievementsSummary {
  total: number;
  unlocked: number;
  achievements: UserAchievement[];
  /** Recently unlocked (for potential toast/animation) */
  recentlyUnlocked: UserAchievement[];
}

interface SocialStats {
  friendCount: number;
  challengeCount: number;
  winCount: number;
}

@Injectable()
export class AchievementsService {
  constructor(
    private readonly statsService: StatsService,
    private readonly streaksService: StreaksService,
    private readonly friendsService: FriendsService,
    private readonly challengesService: ChallengesService,
  ) {}

  async getUserAchievements(userId: string): Promise<AchievementsSummary> {
    const [stats, streak, socialStats] = await Promise.all([
      this.statsService.getUserStats(userId),
      this.streaksService.getStreak(userId),
      this.getSocialStats(userId),
    ]);

    const achievements: UserAchievement[] = ACHIEVEMENTS.map((def) => {
      const progress = this.getProgress(def, stats, streak, socialStats);
      const unlocked = progress >= def.threshold;
      const progressPercent = Math.min(
        100,
        Math.round((progress / def.threshold) * 100),
      );

      return {
        id: def.id,
        category: def.category,
        title: def.title,
        description: def.description,
        emoji: def.emoji,
        threshold: def.threshold,
        unit: def.unit,
        progress,
        unlocked,
        progressPercent,
      };
    });

    const unlocked = achievements.filter((a) => a.unlocked);

    // "Recently unlocked" = unlocked achievements where progress is within 120% of threshold
    const recentlyUnlocked = unlocked.filter(
      (a) => a.progress < a.threshold * 1.2,
    );

    return {
      total: achievements.length,
      unlocked: unlocked.length,
      achievements,
      recentlyUnlocked,
    };
  }

  private async getSocialStats(userId: string): Promise<SocialStats> {
    const [friendCount, challengeCount, winCount] = await Promise.all([
      this.friendsService.getFriendCount(userId),
      this.challengesService.getChallengeCount(userId),
      this.challengesService.getWinCount(userId),
    ]);
    return { friendCount, challengeCount, winCount };
  }

  private getProgress(
    def: AchievementDef,
    stats: UserStatsResult,
    streak: StreakResult,
    social: SocialStats,
  ): number {
    switch (def.category) {
      case 'CALORIES':
        return stats.totalSavedCalories || 0;
      case 'STREAK':
        return Math.max(streak.currentStreak || 0, streak.bestStreak || 0);
      case 'CHECKINS':
        return stats.totalCheckIns || 0;
      case 'MONEY':
        return stats.totalSavedMoney || 0;
      case 'SOCIAL':
        return social.friendCount;
      case 'CHALLENGES':
        if (def.unit === 'wins') return social.winCount;
        if (def.unit === 'weekend-challenges') return social.challengeCount > 0 ? 1 : 0;
        return social.challengeCount;
      case 'DISCIPLINE':
        const bestStreak = Math.max(streak.currentStreak || 0, streak.bestStreak || 0);
        if (def.unit === 'weekends') return bestStreak >= 2 ? 1 : 0;
        if (def.unit === 'clean-weeks') return bestStreak >= 7 ? 1 : 0;
        if (def.unit === 'perfect-months') return bestStreak >= 30 ? 1 : 0;
        if (def.unit === 'quarters') return bestStreak >= 90 ? 1 : 0;
        return 0;
      default:
        return 0;
    }
  }
}
