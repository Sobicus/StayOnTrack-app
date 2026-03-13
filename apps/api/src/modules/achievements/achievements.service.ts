import { Injectable } from '@nestjs/common';
import { StatsService } from '../stats/stats.service';
import { StreaksService } from '../streaks/streaks.service';
import { ACHIEVEMENTS, AchievementDef } from './achievements.constants';

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

@Injectable()
export class AchievementsService {
  constructor(
    private readonly statsService: StatsService,
    private readonly streaksService: StreaksService,
  ) {}

  async getUserAchievements(userId: string): Promise<AchievementsSummary> {
    const [stats, streak] = await Promise.all([
      this.statsService.getUserStats(userId),
      this.streaksService.getStreak(userId),
    ]);

    const achievements: UserAchievement[] = ACHIEVEMENTS.map((def) => {
      const progress = this.getProgress(def, stats, streak);
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
    // (i.e. just barely crossed the line)
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

  private getProgress(
    def: AchievementDef,
    stats: any,
    streak: any,
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
      default:
        return 0;
    }
  }
}
