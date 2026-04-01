import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { HabitLog } from '../entities/habit-log.entity';

@Injectable()
export class HabitLogsQueryRepository {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
  ) {}

  /**
   * Find a single log by habitId and date.
   */
  async findByHabitAndDate(habitId: string, date: string): Promise<HabitLog | null> {
    return this.logRepository.findOne({
      where: { habitId, date },
    });
  }

  /**
   * Find all logs for a user on a specific date, ordered by createdAt ASC.
   */
  async findByUserAndDate(userId: string, date: string): Promise<HabitLog[]> {
    return this.logRepository.find({
      where: { userId, date },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find logs for a user within a date range.
   */
  async findByDateRange(
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
   * Find logs for a specific habit, optionally within a date range.
   */
  async findByHabit(
    userId: string,
    habitId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HabitLog[]> {
    const where: FindOptionsWhere<HabitLog> = { userId, habitId };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.logRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  /**
   * Find a single log by id and userId.
   */
  async findOne(logId: string, userId: string): Promise<HabitLog | null> {
    return this.logRepository.findOne({
      where: { id: logId, userId },
    });
  }

  /**
   * Count logs for a habit within a date range.
   */
  async countByHabitAndDateRange(
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    return this.logRepository.count({
      where: {
        habitId,
        date: Between(startDate, endDate),
      },
    });
  }
}
