import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { HabitLog, HabitLogStatus } from '../entities/habit-log.entity';
import { HabitsService } from '../../habits/services/habits.service';
import { Habit, HabitFrequencyType, HabitType } from '../../habits/entities/habit.entity';
import { CreateHabitLogDto } from '../dto/create-habit-log.dto';
import { BatchCheckinDto } from '../dto/batch-checkin.dto';
import { DaySummaryDto, HabitLogResponseDto } from '../dto/habit-log-response.dto';
import { getSavedCalories, getSavedMoney, XP_REWARDS } from '@stayontrack/contracts';
import { getTodayInTimezone } from '../../../common/utils/date.utils';
import { GamificationService, AddXpResult } from '../../gamification/services/gamification.service';
import { AnalyticsService } from '../../analytics/services/analytics.service';
import { HabitLogsQueryRepository } from '../repositories/habit-logs.query.repository';
import { HabitLogsCommandRepository } from '../repositories/habit-logs.command.repository';

export interface CreateLogResult {
  log: HabitLog;
  xpEarned: number;
  levelUp: boolean;
}

export interface CreateLogParams {
  userId: string;
  dto: CreateHabitLogDto;
  timezone?: string;
}

export interface BatchCheckinParams {
  userId: string;
  dto: BatchCheckinDto;
  timezone?: string;
}

export interface GetLogsByDateRangeParams {
  userId: string;
  startDate: string;
  endDate: string;
}

export interface GetFrequencyStatusParams {
  userId: string;
  date?: string;
  timezone?: string;
}

@Injectable()
export class HabitLogsService {
  constructor(
    private readonly habitLogsQueryRepository: HabitLogsQueryRepository,
    private readonly habitLogsCommandRepository: HabitLogsCommandRepository,
    private readonly habitsService: HabitsService,
    private readonly gamificationService: GamificationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Create a single habit log (check-in for one habit).
   * Calculates savedCalories and savedMoney automatically.
   * Enforces frequency limits for WEEKLY/CUSTOM habits.
   */
  async createLog({ userId, dto, timezone = 'UTC' }: CreateLogParams): Promise<CreateLogResult> {
    // Verify habit belongs to user
    const habit = await this.habitsService.findOneByUser(dto.habitId, userId);

    const date = dto.date || getTodayInTimezone(timezone);
    const portionRatio = this.resolvePortionRatio(dto.status, dto.portionRatio);

    // Check for duplicate
    const existing = await this.habitLogsQueryRepository.findByHabitAndDate(dto.habitId, date);

    const isAchievement = habit.habitType === HabitType.ACHIEVEMENT;

    if (existing) {
      // Update existing log instead of throwing error (user can change their mind)
      existing.status = dto.status;
      existing.portionRatio = portionRatio;
      existing.savedCalories = isAchievement ? 0 : getSavedCalories(habit.caloriesPerOccurrence, portionRatio);
      existing.savedMoney = isAchievement ? 0 : getSavedMoney(habit.pricePerOccurrence, portionRatio);
      existing.completedAmount = isAchievement ? (dto.completedAmount ?? null) : null;
      const saved = await this.habitLogsCommandRepository.save(existing);
      // No XP on updates — only first check-in earns XP
      return { log: saved, xpEarned: 0, levelUp: false };
    }

    // Enforce frequency limits for non-daily habits
    await this.enforceFrequencyLimit(habit, date);

    const log = this.habitLogsCommandRepository.create({
      habitId: dto.habitId,
      userId,
      date,
      status: isAchievement ? HabitLogStatus.AVOIDED : dto.status,
      portionRatio: isAchievement ? 0 : portionRatio,
      savedCalories: isAchievement ? 0 : getSavedCalories(habit.caloriesPerOccurrence, portionRatio),
      savedMoney: isAchievement ? 0 : getSavedMoney(habit.pricePerOccurrence, portionRatio),
      completedAmount: isAchievement ? (dto.completedAmount ?? null) : null,
    });

    const saved = await this.habitLogsCommandRepository.save(log);

    this.analyticsService
      .trackEvent(userId, 'checkin_completed', { habitId: dto.habitId, status: dto.status })
      .catch(() => {});

    // Award XP for check-in
    let totalXpEarned = 0;
    let levelUp = false;

    const checkinResult = await this.gamificationService.addXp(userId, XP_REWARDS.CHECK_IN);
    totalXpEarned += XP_REWARDS.CHECK_IN;
    levelUp = checkinResult.levelUp;

    // Bonus XP if fully avoided (portionRatio === 0) or achievement habit completed
    if (isAchievement || portionRatio === 0) {
      const bonusResult = await this.gamificationService.addXp(userId, XP_REWARDS.FULL_DAY_AVOIDED);
      totalXpEarned += XP_REWARDS.FULL_DAY_AVOIDED;
      if (bonusResult.levelUp) levelUp = true;
    }

    return { log: saved, xpEarned: totalXpEarned, levelUp };
  }

  /**
   * Batch check-in: submit all habits for a day at once.
   * This is the primary flow — user taps through all habits.
   */
  async batchCheckin({ userId, dto, timezone = 'UTC' }: BatchCheckinParams): Promise<CreateLogResult[]> {
    const results: CreateLogResult[] = [];

    for (const logDto of dto.logs) {
      // Use batch date as fallback if individual log doesn't have one
      if (!logDto.date && dto.date) {
        logDto.date = dto.date;
      }
      const result = await this.createLog({ userId, dto: logDto, timezone });
      results.push(result);
    }

    return results;
  }

  /**
   * Get all logs for a specific date with summary.
   */
  async getDaySummary(userId: string, date: string): Promise<DaySummaryDto> {
    const logs = await this.habitLogsQueryRepository.findByUserAndDate(userId, date);

    const activeHabits = await this.habitsService.findActiveByUser(userId);

    const summary = new DaySummaryDto();
    summary.date = date;
    summary.logs = logs.map((log) => HabitLogResponseDto.fromEntity(log));
    summary.totalSavedCalories = logs.reduce((sum, l) => sum + l.savedCalories, 0);
    summary.totalSavedMoney = logs.reduce((sum, l) => sum + l.savedMoney, 0);
    summary.checkedInCount = logs.length;
    summary.totalActiveHabits = activeHabits.length;
    summary.allAvoided = logs.length > 0 && logs.every(
      (l) => l.status === HabitLogStatus.AVOIDED || l.status === HabitLogStatus.PARTIAL,
    );

    return summary;
  }

  /**
   * Get logs for a date range (for history / calendar view).
   */
  async getLogsByDateRange({ userId, startDate, endDate }: GetLogsByDateRangeParams): Promise<HabitLog[]> {
    return this.habitLogsQueryRepository.findByDateRange(userId, startDate, endDate);
  }

  /**
   * Get logs for a specific habit across dates.
   */
  async getLogsByHabit(
    userId: string,
    habitId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HabitLog[]> {
    // Verify ownership
    await this.habitsService.findOneByUser(habitId, userId);

    return this.habitLogsQueryRepository.findByHabit(userId, habitId, startDate, endDate);
  }

  /**
   * Delete a log (undo check-in).
   */
  async deleteLog(logId: string, userId: string): Promise<void> {
    const log = await this.habitLogsQueryRepository.findOne(logId, userId);

    if (!log) {
      throw new NotFoundException('Habit log not found');
    }

    await this.habitLogsCommandRepository.softDelete(log);
  }

  /**
   * Resolve portionRatio based on status.
   * AVOIDED = 0, CONSUMED = 1, PARTIAL requires explicit value.
   */
  private resolvePortionRatio(
    status: HabitLogStatus,
    portionRatio?: number,
  ): number {
    switch (status) {
      case HabitLogStatus.AVOIDED:
        return 0;
      case HabitLogStatus.CONSUMED:
        return 1;
      case HabitLogStatus.PARTIAL:
        if (portionRatio === undefined || portionRatio === null) {
          throw new BadRequestException(
            'portionRatio is required for PARTIAL status',
          );
        }
        if (portionRatio <= 0 || portionRatio >= 1) {
          throw new BadRequestException(
            'portionRatio must be between 0 and 1 (exclusive) for PARTIAL status',
          );
        }
        return portionRatio;
      default:
        return 0;
    }
  }

  /**
   * Get frequency status for all active habits (how many check-ins used/remaining this week).
   */
  async getFrequencyStatus(
    { userId, date, timezone = 'UTC' }: GetFrequencyStatusParams,
  ): Promise<Array<{ habitId: string; used: number; limit: number | null; remaining: number | null }>> {
    const targetDate = date || getTodayInTimezone(timezone);
    const habits = await this.habitsService.findActiveByUser(userId);
    const { start, end } = this.getIsoWeekBounds(targetDate);

    const results: Array<{ habitId: string; used: number; limit: number | null; remaining: number | null }> = [];

    for (const habit of habits) {
      if (habit.frequencyType === HabitFrequencyType.DAILY) {
        results.push({ habitId: habit.id, used: 0, limit: null, remaining: null });
        continue;
      }

      const weeklyLimit = this.getWeeklyLimit(habit);
      const used = await this.habitLogsQueryRepository.countByHabitAndDateRange(habit.id, start, end);

      results.push({
        habitId: habit.id,
        used,
        limit: weeklyLimit,
        remaining: Math.max(0, weeklyLimit - used),
      });
    }

    return results;
  }

  /**
   * Enforce frequency limit: reject check-in if weekly limit already reached.
   * Only applies to WEEKLY and CUSTOM frequency types.
   */
  private async enforceFrequencyLimit(habit: Habit, date: string): Promise<void> {
    if (habit.frequencyType === HabitFrequencyType.DAILY) {
      return; // No weekly limit for daily habits
    }

    const weeklyLimit = this.getWeeklyLimit(habit);
    const { start, end } = this.getIsoWeekBounds(date);
    const used = await this.habitLogsQueryRepository.countByHabitAndDateRange(habit.id, start, end);

    if (used >= weeklyLimit) {
      throw new BadRequestException(
        `Weekly check-in limit reached for this habit (${used}/${weeklyLimit} this week)`,
      );
    }
  }

  /**
   * Get the weekly limit for a habit based on its frequency type.
   * WEEKLY defaults to 1, CUSTOM uses occurrencesPerWeek.
   */
  private getWeeklyLimit(habit: Habit): number {
    if (habit.frequencyType === HabitFrequencyType.WEEKLY) {
      return habit.occurrencesPerWeek ?? 1;
    }
    // CUSTOM
    return habit.occurrencesPerWeek ?? 7;
  }

  /**
   * Get ISO week boundaries (Monday to Sunday) for a given date string.
   */
  private getIsoWeekBounds(dateStr: string): { start: string; end: string } {
    const date = new Date(dateStr + 'T12:00:00Z'); // noon UTC to avoid DST edge cases
    const dayOfWeek = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to ISO day: Mon=0, Tue=1, ..., Sun=6
    const isoDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - isoDay);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  }

}
