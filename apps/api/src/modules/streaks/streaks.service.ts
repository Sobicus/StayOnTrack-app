import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog, HabitLogStatus } from '../habit-logs/entities/habit-log.entity';
import { HabitsService } from '../habits/services/habits.service';
import { User } from '../users/entities/user.entity';
import { PARTIAL_SUCCESS_THRESHOLD, STREAK_SHIELDS_PER_WEEK, STREAK_RECOVERY_XP_COST, XP_REWARDS } from '@stayontrack/contracts';
import { getTodayInTimezone, getDayOfWeekInTimezone } from '../../common/utils/date.utils';
import { GamificationService } from '../gamification/services/gamification.service';

/** Streak day counts that trigger a milestone XP reward */
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

export interface StreakRecoveryResult {
  recovered: boolean;
  xpSpent: number;
  currentStreak: number;
  remainingXp: number;
}

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
    private readonly gamificationService: GamificationService,
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
    const today = getTodayInTimezone(user.timezone);
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
   * Check if the current streak has just hit a milestone (7, 14, 30, 60, 90, 180, 365).
   * If so, award STREAK_MILESTONE XP. Call this after a check-in that may extend the streak.
   * Returns the milestone reached (or null) and XP result.
   */
  async checkAndAwardStreakMilestone(
    userId: string,
  ): Promise<{ milestone: number | null; xpAwarded: number; levelUp: boolean }> {
    const streak = await this.getStreak(userId);

    if (STREAK_MILESTONES.includes(streak.currentStreak)) {
      const result = await this.gamificationService.addXp(userId, XP_REWARDS.STREAK_MILESTONE);
      return {
        milestone: streak.currentStreak,
        xpAwarded: XP_REWARDS.STREAK_MILESTONE,
        levelUp: result.levelUp,
      };
    }

    return { milestone: null, xpAwarded: 0, levelUp: false };
  }

  /**
   * Recover a broken streak by spending XP.
   *
   * Rules:
   * - Streak must have been broken yesterday (last log was 2 days ago)
   * - User must have enough XP (STREAK_RECOVERY_XP_COST)
   * - Deducts XP and creates recovery log entries for the missed day
   */
  async recoverStreak(userId: string): Promise<StreakRecoveryResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const today = getTodayInTimezone(user.timezone);
    const yesterday = this.getDateOffset(today, -1);

    // Get the most recent check-in date
    const dates = await this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.date', 'date')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC')
      .limit(1)
      .getRawMany();

    if (dates.length === 0) {
      throw new BadRequestException('No check-in history found — nothing to recover');
    }

    const lastDate = dates[0].date;
    const twoDaysAgo = this.getDateOffset(today, -2);

    // Streak is recoverable only if last check-in was exactly 2 days ago
    // (meaning yesterday was missed, breaking the streak)
    if (lastDate !== twoDaysAgo) {
      if (lastDate === today || lastDate === yesterday) {
        throw new BadRequestException('Your streak is not broken — no recovery needed');
      }
      throw new BadRequestException('Streak was broken more than 1 day ago — recovery is no longer available');
    }

    // Check XP
    if (user.totalXp < STREAK_RECOVERY_XP_COST) {
      throw new BadRequestException(
        `Not enough XP. You need ${STREAK_RECOVERY_XP_COST} XP but only have ${user.totalXp} XP`,
      );
    }

    // Get active habits to create recovery logs for the missed day
    const activeHabits = await this.habitsService.findActiveByUser(userId);
    if (activeHabits.length === 0) {
      throw new BadRequestException('No active habits found');
    }

    // Check that no logs exist for yesterday (the missed day)
    const existingLogs = await this.logRepository.find({
      where: { userId, date: yesterday },
    });
    if (existingLogs.length > 0) {
      throw new BadRequestException('Yesterday already has check-in entries');
    }

    // Deduct XP
    user.totalXp -= STREAK_RECOVERY_XP_COST;
    await this.userRepository.save(user);

    // Create "AVOIDED" recovery log entries for each active habit on the missed day
    const recoveryLogs = activeHabits.map((habit) =>
      this.logRepository.create({
        habitId: habit.id,
        userId,
        date: yesterday,
        status: HabitLogStatus.AVOIDED,
        portionRatio: 0,
        savedCalories: habit.caloriesPerOccurrence,
        savedMoney: habit.pricePerOccurrence,
      }),
    );
    await this.logRepository.save(recoveryLogs);

    // Get updated streak
    const streakResult = await this.getStreak(userId);

    return {
      recovered: true,
      xpSpent: STREAK_RECOVERY_XP_COST,
      currentStreak: streakResult.currentStreak,
      remainingXp: user.totalXp,
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

    const todayStr = getTodayInTimezone(user.timezone);
    const lastReplenish = user.lastShieldReplenishDate
      ? new Date(user.lastShieldReplenishDate).toISOString().split('T')[0]
      : null;

    // Check if today is Monday in the user's timezone and shield hasn't been replenished today
    const dayOfWeek = getDayOfWeekInTimezone(user.timezone);
    if (dayOfWeek === 1) {
      // Monday = 1
      if (!lastReplenish || lastReplenish !== todayStr) {
        user.streakShieldsRemaining = STREAK_SHIELDS_PER_WEEK;
        user.lastShieldReplenishDate = new Date(todayStr + 'T00:00:00Z');
        await this.userRepository.save(user);
      }
    }
  }

  private getDateOffset(date: string, days: number): string {
    const d = new Date(date + 'T12:00:00Z'); // noon UTC to avoid DST edge cases
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
  }
}
