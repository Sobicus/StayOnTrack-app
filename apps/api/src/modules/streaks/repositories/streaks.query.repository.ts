import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from '../../habit-logs/entities/habit-log.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class StreaksQueryRepository {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get distinct check-in dates for a user, ordered DESC.
   */
  async getDistinctDatesDesc(userId: string): Promise<Array<{ date: string }>> {
    return this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.date', 'date')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC')
      .getRawMany();
  }

  /**
   * Get distinct check-in dates for a user, ordered ASC.
   */
  async getDistinctDatesAsc(userId: string): Promise<Array<{ date: string }>> {
    return this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.date', 'date')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'ASC')
      .getRawMany();
  }

  /**
   * Get most recent check-in date for a user (limit 1, DESC).
   */
  async getMostRecentDate(userId: string): Promise<Array<{ date: string }>> {
    return this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.date', 'date')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC')
      .limit(1)
      .getRawMany();
  }

  /**
   * Get all logs for a user on a specific date.
   */
  async getLogsByDate(userId: string, date: string): Promise<HabitLog[]> {
    return this.logRepository.find({
      where: { userId, date },
    });
  }

  /**
   * Find a user by ID.
   */
  async findUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
