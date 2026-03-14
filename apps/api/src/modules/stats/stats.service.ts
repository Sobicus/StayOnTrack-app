import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { ActivitiesService } from '../activities/activities.service';
import { User } from '../users/entities/user.entity';
import {
  getPotentialWeightAvoided,
  getCaloriesPerMinute,
  getCaloriesPerRep,
  getActivityEquivalent,
} from '@stayontrack/contracts';
import { getTodayInTimezone } from '../../common/utils/date.utils';

export interface WeeklyTrendPoint {
  week: string;
  savedCalories: number;
  savedMoney: number;
}

export interface UserStatsResult {
  totalSavedCalories: number;
  totalSavedMoney: number;
  potentialWeightAvoidedKg: number;
  totalCheckIns: number;
  totalDaysTracked: number;
}

export interface LiveStatsResult {
  /** Total saved from all past days (before today) */
  pastCalories: number;
  pastMoney: number;
  pastWeightKg: number;
  /** Today's checked-in totals so far */
  todayCalories: number;
  todayMoney: number;
  /** Expected daily total from today's check-ins (for interpolation) */
  todayExpectedCalories: number;
  todayExpectedMoney: number;
  /** User's journey start time */
  startedAt: string;
  /** Day boundary hour (0-23) */
  dayEndHour: number;
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
   * Get live stats for the hero widget.
   * Returns past days total + today's data for frontend interpolation.
   */
  async getLiveStats(user: User): Promise<LiveStatsResult> {
    const today = getTodayInTimezone(user.timezone || 'UTC');

    // Past days (everything before today)
    const pastResult = await this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'cal')
      .addSelect('SUM(log.savedMoney)', 'money')
      .where('log.userId = :userId', { userId: user.id })
      .andWhere('log.date < :today', { today })
      .getRawOne();

    const pastCalories = parseFloat(pastResult?.cal) || 0;
    const pastMoney = parseFloat(pastResult?.money) || 0;

    // Today's check-ins
    const todayResult = await this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'cal')
      .addSelect('SUM(log.savedMoney)', 'money')
      .where('log.userId = :userId', { userId: user.id })
      .andWhere('log.date = :today', { today })
      .getRawOne();

    const todayCalories = parseFloat(todayResult?.cal) || 0;
    const todayMoney = parseFloat(todayResult?.money) || 0;

    // Expected daily total = sum of all habits' calories/cost that have a check-in today as AVOIDED
    // For interpolation: use today's actual check-in total as the expected value
    // (what's already checked in today is what we interpolate over the day)
    const todayExpectedCalories = todayCalories;
    const todayExpectedMoney = todayMoney;

    return {
      pastCalories,
      pastMoney,
      pastWeightKg: parseFloat(getPotentialWeightAvoided(pastCalories).toFixed(3)),
      todayCalories,
      todayMoney,
      todayExpectedCalories,
      todayExpectedMoney,
      startedAt: user.createdAt.toISOString(),
      dayEndHour: user.dayEndHour,
    };
  }

  /**
   * Get weekly trends over a number of months.
   * Returns saved calories and money grouped by ISO week.
   */
  async getWeeklyTrends(
    userId: string,
    months: number = 3,
  ): Promise<WeeklyTrendPoint[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const rows = await this.logRepository
      .createQueryBuilder('log')
      .select(
        "TO_CHAR(DATE_TRUNC('week', log.date::date), 'IYYY-\"W\"IW')",
        'week',
      )
      .addSelect('SUM(log.savedCalories)', 'savedCalories')
      .addSelect('SUM(log.savedMoney)', 'savedMoney')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :startStr', { startStr })
      .andWhere('log.date <= :endStr', { endStr })
      .groupBy("DATE_TRUNC('week', log.date::date)")
      .orderBy("DATE_TRUNC('week', log.date::date)", 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      week: row.week,
      savedCalories: parseFloat(row.savedCalories) || 0,
      savedMoney: parseFloat(row.savedMoney) || 0,
    }));
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
