import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog, HabitLogStatus } from '../habit-logs/entities/habit-log.entity';
import { HabitsService } from '../habits/habits.service';
import { User } from '../users/entities/user.entity';
import { PARTIAL_SUCCESS_THRESHOLD, STREAK_SHIELDS_PER_WEEK } from '@stayontrack/contracts';

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  streakShieldsRemaining: number;
  lastCheckinDate: string | null;
  isShieldActive: boolean;
}

@Injectable()
export class StreaksService {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly habitsService: HabitsService,
  ) {}

  /**
   * Calculate current streak and best streak for a user.
   *
   * Streak rules:
   * - Day is successful if ALL active habits checked in with status AVOIDED
   *   OR (PARTIAL with portionRatio <= PARTIAL_SUCCESS_THRESHOLD)
   * - CONSUMED = streak break (unless Streak Shield available)
   * - Streak Shield: auto-applies on first break of the week, protects streak
   * - Shield replenishes every Monday (1 per week)
   */
  async getStreak(userId: string): Promise<StreakResult> {
    // Replenish shield if needed
    await this.replenishShieldIfNeeded(userId);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        streakShieldsRemaining: 0,
        lastCheckinDate: null,
        isShieldActive: false,
      };
    }

    // Get all unique dates with check-ins, ordered DESC
    const dates = await this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.date', 'date')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC')
      .getRawMany();

    if (dates.length === 0) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        streakShieldsRemaining: user.streakShieldsRemaining,
        lastCheckinDate: null,
        isShieldActive: false,
      };
    }

    const activeHabits = await this.habitsService.findActiveByUser(userId);
    if (activeHabits.length === 0) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        streakShieldsRemaining: user.streakShieldsRemaining,
        lastCheckinDate: dates[0]?.date || null,
        isShieldActive: false,
      };
    }

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let shieldUsedToday = false;

    // Check if the most recent date is today or yesterday (streak is still alive)
    const today = this.getTodayDate();
    const yesterday = this.getDateOffset(today, -1);
    const lastDate = dates[0]?.date;

    if (lastDate !== today && lastDate !== yesterday) {
      // Streak is broken — last check-in was more than 1 day ago
      return {
        currentStreak: 0,
        bestStreak: await this.calculateBestStreak(userId, activeHabits.length),
        streakShieldsRemaining: user.streakShieldsRemaining,
        lastCheckinDate: lastDate,
        isShieldActive: false,
      };
    }

    // Walk backwards through dates
    let expectedDate = lastDate === today ? today : yesterday;

    for (const row of dates) {
      const date = row.date;

      // Check for gaps
      while (expectedDate > date) {
        // There's a gap — this day had no check-in
        // Could use shield here
        tempStreak = 0;
        expectedDate = this.getDateOffset(expectedDate, -1);
      }

      if (date !== expectedDate) continue;

      // Check if this day was successful
      const daySuccess = await this.isDaySuccessful(userId, date, activeHabits.length);

      if (daySuccess) {
        tempStreak++;
      } else {
        // Day failed — check if shield can save it
        if (user.streakShieldsRemaining > 0 && !shieldUsedToday) {
          tempStreak++; // Shield protects the streak
          shieldUsedToday = true;
        } else {
          break; // Streak breaks
        }
      }

      expectedDate = this.getDateOffset(expectedDate, -1);
    }

    currentStreak = tempStreak;
    bestStreak = Math.max(
      currentStreak,
      await this.calculateBestStreak(userId, activeHabits.length),
    );

    return {
      currentStreak,
      bestStreak,
      streakShieldsRemaining: user.streakShieldsRemaining,
      lastCheckinDate: lastDate,
      isShieldActive: shieldUsedToday,
    };
  }

  /**
   * Check if a day was successful.
   * All active habits must be checked in with AVOIDED or PARTIAL (≤ threshold).
   */
  private async isDaySuccessful(
    userId: string,
    date: string,
    activeHabitCount: number,
  ): Promise<boolean> {
    const logs = await this.logRepository.find({
      where: { userId, date },
    });

    // Must have checked in for all active habits
    if (logs.length < activeHabitCount) return false;

    // All logs must be successful
    return logs.every((log) => {
      if (log.status === HabitLogStatus.AVOIDED) return true;
      if (
        log.status === HabitLogStatus.PARTIAL &&
        log.portionRatio <= PARTIAL_SUCCESS_THRESHOLD
      ) {
        return true;
      }
      return false;
    });
  }

  /**
   * Calculate the best streak ever (simplified — scans all dates).
   */
  private async calculateBestStreak(
    userId: string,
    activeHabitCount: number,
  ): Promise<number> {
    const dates = await this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.date', 'date')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'ASC')
      .getRawMany();

    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate: string | null = null;

    for (const row of dates) {
      const date = row.date;
      const isConsecutive =
        prevDate && this.getDateOffset(prevDate, 1) === date;

      const success = await this.isDaySuccessful(
        userId,
        date,
        activeHabitCount,
      );

      if (success && (isConsecutive || !prevDate || tempStreak === 0)) {
        tempStreak++;
      } else if (success) {
        tempStreak = 1;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 0;
      }

      prevDate = date;
    }

    return Math.max(bestStreak, tempStreak);
  }

  /**
   * Replenish streak shield if it's a new week (Monday).
   */
  private async replenishShieldIfNeeded(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const today = new Date();
    const lastReplenish = user.lastShieldReplenishDate
      ? new Date(user.lastShieldReplenishDate)
      : null;

    // Check if today is Monday and shield hasn't been replenished this week
    if (today.getDay() === 1) {
      // Monday = 1
      if (
        !lastReplenish ||
        lastReplenish.toISOString().split('T')[0] !==
          today.toISOString().split('T')[0]
      ) {
        user.streakShieldsRemaining = STREAK_SHIELDS_PER_WEEK;
        user.lastShieldReplenishDate = today;
        await this.userRepository.save(user);
      }
    }
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDateOffset(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
