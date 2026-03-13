import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { HabitLog, HabitLogStatus } from './entities/habit-log.entity';
import { HabitsService } from '../habits/habits.service';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { BatchCheckinDto } from './dto/batch-checkin.dto';
import { DaySummaryDto, HabitLogResponseDto } from './dto/habit-log-response.dto';
import { getSavedCalories, getSavedMoney } from '@stayontrack/contracts';

@Injectable()
export class HabitLogsService {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
    private readonly habitsService: HabitsService,
  ) {}

  /**
   * Create a single habit log (check-in for one habit).
   * Calculates savedCalories and savedMoney automatically.
   */
  async createLog(userId: string, dto: CreateHabitLogDto): Promise<HabitLog> {
    // Verify habit belongs to user
    const habit = await this.habitsService.findOneByUser(dto.habitId, userId);

    const date = dto.date || this.getTodayDate();
    const portionRatio = this.resolvePortionRatio(dto.status, dto.portionRatio);

    // Check for duplicate
    const existing = await this.logRepository.findOne({
      where: { habitId: dto.habitId, date },
    });

    if (existing) {
      // Update existing log instead of throwing error (user can change their mind)
      existing.status = dto.status;
      existing.portionRatio = portionRatio;
      existing.savedCalories = getSavedCalories(habit.caloriesPerOccurrence, portionRatio);
      existing.savedMoney = getSavedMoney(habit.pricePerOccurrence, portionRatio);
      return this.logRepository.save(existing);
    }

    const log = this.logRepository.create({
      habitId: dto.habitId,
      userId,
      date,
      status: dto.status,
      portionRatio,
      savedCalories: getSavedCalories(habit.caloriesPerOccurrence, portionRatio),
      savedMoney: getSavedMoney(habit.pricePerOccurrence, portionRatio),
    });

    return this.logRepository.save(log);
  }

  /**
   * Batch check-in: submit all habits for a day at once.
   * This is the primary flow — user taps through all habits.
   */
  async batchCheckin(
    userId: string,
    dto: BatchCheckinDto,
  ): Promise<HabitLog[]> {
    const results: HabitLog[] = [];

    for (const logDto of dto.logs) {
      // Use batch date as fallback if individual log doesn't have one
      if (!logDto.date && dto.date) {
        logDto.date = dto.date;
      }
      const log = await this.createLog(userId, logDto);
      results.push(log);
    }

    return results;
  }

  /**
   * Get all logs for a specific date with summary.
   */
  async getDaySummary(userId: string, date: string): Promise<DaySummaryDto> {
    const logs = await this.logRepository.find({
      where: { userId, date },
      order: { createdAt: 'ASC' },
    });

    const activeHabits = await this.habitsService.findActiveByUser(userId);

    const summary = new DaySummaryDto();
    summary.date = date;
    summary.logs = logs.map(HabitLogResponseDto.fromEntity);
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
  async getLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<HabitLog[]> {
    return this.logRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC', createdAt: 'ASC' },
    });
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

    const where: any = { userId, habitId };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.logRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  /**
   * Delete a log (undo check-in).
   */
  async deleteLog(logId: string, userId: string): Promise<void> {
    const log = await this.logRepository.findOne({
      where: { id: logId, userId },
    });

    if (!log) {
      throw new NotFoundException('Habit log not found');
    }

    await this.logRepository.remove(log);
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

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
