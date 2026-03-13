import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { ActivitiesService } from '../activities/activities.service';
import {
  getPotentialWeightAvoided,
  getCaloriesPerMinute,
  getCaloriesPerRep,
  getActivityEquivalent,
} from '@stayontrack/contracts';

export interface UserStatsResult {
  totalSavedCalories: number;
  totalSavedMoney: number;
  potentialWeightAvoidedKg: number;
  totalCheckIns: number;
  totalDaysTracked: number;
}

export interface EffortEquivalentResult {
  activitySlug: string;
  activityName: string;
  unit: string;
  amount: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Get cumulative stats for a user.
   */
  async getUserStats(userId: string): Promise<UserStatsResult> {
    const result = await this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'totalSavedCalories')
      .addSelect('SUM(log.savedMoney)', 'totalSavedMoney')
      .addSelect('COUNT(*)', 'totalCheckIns')
      .addSelect('COUNT(DISTINCT log.date)', 'totalDaysTracked')
      .where('log.userId = :userId', { userId })
      .getRawOne();

    const totalSavedCalories = parseFloat(result?.totalSavedCalories) || 0;
    const totalSavedMoney = parseFloat(result?.totalSavedMoney) || 0;

    return {
      totalSavedCalories,
      totalSavedMoney,
      potentialWeightAvoidedKg: parseFloat(
        getPotentialWeightAvoided(totalSavedCalories).toFixed(3),
      ),
      totalCheckIns: parseInt(result?.totalCheckIns) || 0,
      totalDaysTracked: parseInt(result?.totalDaysTracked) || 0,
    };
  }

  /**
   * Calculate effort equivalents for saved calories.
   * "Your 500 saved calories = 53 min running, 1562 squats, 42 min cycling..."
   */
  async getEffortEquivalents(
    userId: string,
    weightKg: number = 75,
  ): Promise<EffortEquivalentResult[]> {
    const stats = await this.getUserStats(userId);
    const savedCalories = stats.totalSavedCalories;

    if (savedCalories <= 0) return [];

    const activities = await this.activitiesService.findAll();
    const equivalents: EffortEquivalentResult[] = [];

    for (const activity of activities) {
      let caloriesPerUnit: number;

      if (activity.unit === 'MINUTE' && activity.met) {
        caloriesPerUnit = getCaloriesPerMinute(activity.met, weightKg);
      } else {
        caloriesPerUnit = getCaloriesPerRep(
          activity.caloriesPerUnitBase,
          weightKg,
          activity.baseWeightKg,
        );
      }

      if (caloriesPerUnit > 0) {
        const amount = getActivityEquivalent(savedCalories, caloriesPerUnit);
        equivalents.push({
          activitySlug: activity.slug,
          activityName: activity.name,
          unit: activity.unit === 'MINUTE' ? 'minutes' : 'reps',
          amount: parseFloat(amount.toFixed(1)),
        });
      }
    }

    return equivalents;
  }

  /**
   * Get stats for a specific date range.
   */
  async getStatsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<UserStatsResult> {
    const result = await this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'totalSavedCalories')
      .addSelect('SUM(log.savedMoney)', 'totalSavedMoney')
      .addSelect('COUNT(*)', 'totalCheckIns')
      .addSelect('COUNT(DISTINCT log.date)', 'totalDaysTracked')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :startDate', { startDate })
      .andWhere('log.date <= :endDate', { endDate })
      .getRawOne();

    const totalSavedCalories = parseFloat(result?.totalSavedCalories) || 0;
    const totalSavedMoney = parseFloat(result?.totalSavedMoney) || 0;

    return {
      totalSavedCalories,
      totalSavedMoney,
      potentialWeightAvoidedKg: parseFloat(
        getPotentialWeightAvoided(totalSavedCalories).toFixed(3),
      ),
      totalCheckIns: parseInt(result?.totalCheckIns) || 0,
      totalDaysTracked: parseInt(result?.totalDaysTracked) || 0,
    };
  }
}
