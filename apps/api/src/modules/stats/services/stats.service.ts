import { Injectable } from '@nestjs/common';
import { ActivitiesService } from '../../activities/services/activities.service';
import { User } from '../../users/entities/user.entity';
import {
  getPotentialWeightAvoided,
  getCaloriesPerMinute,
  getCaloriesPerRep,
  getActivityEquivalent,
} from '@stayontrack/contracts';
import { getTodayInTimezone } from '../../../common/utils/date.utils';
import { StatsQueryRepository } from '../repositories/stats.query.repository';

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

export interface DayRate {
  day: number;
  rate: number;
  total: number;
}

export interface HabitCalorieStat {
  habitId: string;
  title: string;
  calories: number;
}

export interface CategoryCalorieStat {
  category: string;
  calories: number;
}

export interface PatternsResult {
  dayRates: DayRate[];
  bestDay: DayRate;
  worstDay: DayRate;
  categories: CategoryCalorieStat[];
  topHabits: HabitCalorieStat[];
  totalLogs: number;
}

export interface GetStatsByDateRangeParams {
  userId: string;
  startDate: string;
  endDate: string;
}

export interface GetReportParams {
  userId: string;
  period: 'month' | 'year';
  date: string;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly statsQueryRepository: StatsQueryRepository,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Get cumulative stats for a user.
   */
  async getUserStats(userId: string): Promise<UserStatsResult> {
    const result = await this.statsQueryRepository.getAggregatedStats(userId);

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
    const pastResult = await this.statsQueryRepository.getPastDaysSums(user.id, today);

    const pastCalories = parseFloat(pastResult?.cal) || 0;
    const pastMoney = parseFloat(pastResult?.money) || 0;

    // Today's check-ins
    const todayResult = await this.statsQueryRepository.getDaySums(user.id, today);

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

    const rows = await this.statsQueryRepository.getWeeklyTrendRows(userId, startStr, endStr);

    return rows.map((row) => ({
      week: row.week,
      savedCalories: parseFloat(row.savedCalories) || 0,
      savedMoney: parseFloat(row.savedMoney) || 0,
    }));
  }

  /**
   * Get stats for a specific date range.
   */
  async getStatsByDateRange({ userId, startDate, endDate }: GetStatsByDateRangeParams): Promise<UserStatsResult> {
    const result = await this.statsQueryRepository.getAggregatedStatsByDateRange(
      userId,
      startDate,
      endDate,
    );

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
   * Get pattern analysis for a user (day-of-week rates, category breakdown, top habits).
   */
  async getPatterns(userId: string): Promise<PatternsResult | null> {
    const logs = await this.statsQueryRepository.findAllLogsByUser(userId);

    if (logs.length < 7) return null;

    // Day of week analysis (0=Sun, 6=Sat)
    const dayStats: Record<number, { total: number; avoided: number }> = {};
    for (let i = 0; i < 7; i++) dayStats[i] = { total: 0, avoided: 0 };

    for (const log of logs) {
      const day = new Date(log.date + 'T12:00:00Z').getUTCDay();
      dayStats[day].total++;
      if (log.status === 'AVOIDED') dayStats[day].avoided++;
    }

    const dayRates = Object.entries(dayStats).map(([day, s]) => ({
      day: parseInt(day),
      rate: s.total > 0 ? Math.round((s.avoided / s.total) * 100) : 0,
      total: s.total,
    }));

    const bestDay = dayRates.reduce((a, b) => (a.rate > b.rate ? a : b));
    const worstDay = dayRates.reduce((a, b) => (a.rate < b.rate ? a : b));

    // Category breakdown
    const habits = await this.statsQueryRepository.findHabitsByUser(userId);
    const habitMap = new Map(habits.map((h) => [h.id, h]));
    const categoryStats: Record<string, number> = {};

    for (const log of logs) {
      if (log.status === 'AVOIDED') {
        const habit = habitMap.get(log.habitId);
        if (habit) {
          categoryStats[habit.category] =
            (categoryStats[habit.category] || 0) + log.savedCalories;
        }
      }
    }

    const categories = Object.entries(categoryStats)
      .map(([category, calories]) => ({ category, calories }))
      .sort((a, b) => b.calories - a.calories);

    // Top habits by saved calories
    const habitCalories: Record<string, number> = {};
    for (const log of logs) {
      if (log.status === 'AVOIDED') {
        habitCalories[log.habitId] =
          (habitCalories[log.habitId] || 0) + log.savedCalories;
      }
    }

    const topHabits = Object.entries(habitCalories)
      .map(([habitId, calories]) => ({
        habitId,
        title: habitMap.get(habitId)?.title || 'Unknown',
        calories,
      }))
      .sort((a, b) => b.calories - a.calories)
      .slice(0, 3);

    return {
      dayRates,
      bestDay,
      worstDay,
      categories,
      topHabits,
      totalLogs: logs.length,
    };
  }

  /**
   * Get human-readable insight strings for a user.
   */
  async getInsights(userId: string): Promise<string[]> {
    const patterns = await this.getPatterns(userId);
    if (!patterns) return [];

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const insights: string[] = [];
    const { bestDay, worstDay, topHabits, categories } = patterns;

    if (bestDay.rate > 0) {
      insights.push(
        `Your strongest day is ${dayNames[bestDay.day]} with ${bestDay.rate}% avoidance rate`,
      );
    }
    if (worstDay.rate < 100 && worstDay.total > 0) {
      insights.push(
        `${dayNames[worstDay.day]} is your most challenging day (${worstDay.rate}%)`,
      );
    }
    if (topHabits.length > 0) {
      insights.push(
        `Most avoided: ${topHabits[0].title} (${topHabits[0].calories.toLocaleString()} kcal saved)`,
      );
    }
    if (categories.length > 0) {
      insights.push(
        `You save most on ${categories[0].category.replace('_', ' ')}`,
      );
    }

    return insights;
  }

  /**
   * Get a monthly or yearly report (Wrapped style).
   */
  async getReport({ userId, period, date }: GetReportParams): Promise<Record<string, unknown> | null> {
    const d = new Date(date + '-01');
    let startDate: string;
    let endDate: string;

    if (period === 'month') {
      startDate = `${date}-01`;
      const lastDay = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
      ).getDate();
      endDate = `${date}-${String(lastDay).padStart(2, '0')}`;
    } else {
      startDate = `${date.slice(0, 4)}-01-01`;
      endDate = `${date.slice(0, 4)}-12-31`;
    }

    const logs = await this.statsQueryRepository.findLogsByDateRange(userId, startDate, endDate);

    if (logs.length === 0) return null;

    const avoidedLogs = logs.filter((l) => l.status === 'AVOIDED');
    const totalCalories = avoidedLogs.reduce(
      (sum, l) => sum + l.savedCalories,
      0,
    );
    const totalMoney = avoidedLogs.reduce((sum, l) => sum + l.savedMoney, 0);
    const totalWeight = totalCalories / 7700;
    const totalCheckIns = logs.length;
    const avoidedCount = avoidedLogs.length;
    const avoidanceRate = Math.round((avoidedCount / totalCheckIns) * 100);

    // Top habits
    const habits = await this.statsQueryRepository.findHabitsByUser(userId);
    const habitMap = new Map(habits.map((h) => [h.id, h]));
    const habitCals: Record<string, number> = {};
    for (const log of avoidedLogs) {
      habitCals[log.habitId] =
        (habitCals[log.habitId] || 0) + log.savedCalories;
    }
    const topHabits = Object.entries(habitCals)
      .map(([id, cal]) => ({
        title: habitMap.get(id)?.title || '?',
        calories: cal,
      }))
      .sort((a, b) => b.calories - a.calories)
      .slice(0, 3);

    // Fun equivalents
    const marathons = (totalCalories / 2600).toFixed(1);
    const bigMacs = Math.floor(totalCalories / 550);

    return {
      period,
      date,
      startDate,
      endDate,
      totalCalories,
      totalMoney,
      totalWeight,
      totalCheckIns,
      avoidanceRate,
      topHabits,
      marathons,
      bigMacs,
    };
  }
}
