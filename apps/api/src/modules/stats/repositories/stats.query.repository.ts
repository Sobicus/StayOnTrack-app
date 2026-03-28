import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from '../../habit-logs/entities/habit-log.entity';
import { Habit } from '../../habits/entities/habit.entity';

@Injectable()
export class StatsQueryRepository {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
  ) {}

  /**
   * Get aggregated stats (calories, money, check-ins, days) for a user.
   */
  async getAggregatedStats(userId: string): Promise<any> {
    return this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'totalSavedCalories')
      .addSelect('SUM(log.savedMoney)', 'totalSavedMoney')
      .addSelect('COUNT(*)', 'totalCheckIns')
      .addSelect('COUNT(DISTINCT log.date)', 'totalDaysTracked')
      .where('log.userId = :userId', { userId })
      .getRawOne();
  }

  /**
   * Get aggregated stats for a user within a date range.
   */
  async getAggregatedStatsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    return this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'totalSavedCalories')
      .addSelect('SUM(log.savedMoney)', 'totalSavedMoney')
      .addSelect('COUNT(*)', 'totalCheckIns')
      .addSelect('COUNT(DISTINCT log.date)', 'totalDaysTracked')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :startDate', { startDate })
      .andWhere('log.date <= :endDate', { endDate })
      .getRawOne();
  }

  /**
   * Get sum of calories and money before a given date.
   */
  async getPastDaysSums(
    userId: string,
    beforeDate: string,
  ): Promise<any> {
    return this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'cal')
      .addSelect('SUM(log.savedMoney)', 'money')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date < :beforeDate', { beforeDate })
      .getRawOne();
  }

  /**
   * Get sum of calories and money for a specific date.
   */
  async getDaySums(
    userId: string,
    date: string,
  ): Promise<any> {
    return this.logRepository
      .createQueryBuilder('log')
      .select('SUM(log.savedCalories)', 'cal')
      .addSelect('SUM(log.savedMoney)', 'money')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date = :date', { date })
      .getRawOne();
  }

  /**
   * Get weekly trend data grouped by ISO week.
   */
  async getWeeklyTrendRows(
    userId: string,
    startStr: string,
    endStr: string,
  ): Promise<Array<{ week: string; savedCalories: string; savedMoney: string }>> {
    return this.logRepository
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
  }

  /**
   * Get all logs for a user.
   */
  async findAllLogsByUser(userId: string): Promise<HabitLog[]> {
    return this.logRepository.find({ where: { userId } });
  }

  /**
   * Get all logs for a user within a date range.
   */
  async findLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<HabitLog[]> {
    return this.logRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :startDate AND log.date <= :endDate', {
        startDate,
        endDate,
      })
      .getMany();
  }

  /**
   * Get all habits for a user.
   */
  async findHabitsByUser(userId: string): Promise<Habit[]> {
    return this.habitRepository.find({ where: { userId } });
  }
}
