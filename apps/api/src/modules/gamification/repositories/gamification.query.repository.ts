import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Quest, QuestType } from '../entities/quest.entity';
import { HabitLog, HabitLogStatus } from '../../habit-logs/entities/habit-log.entity';
import { Habit } from '../../habits/entities/habit.entity';

@Injectable()
export class GamificationQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Quest)
    private readonly questRepository: Repository<Quest>,
    @InjectRepository(HabitLog)
    private readonly habitLogRepository: Repository<HabitLog>,
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
  ) {}

  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findQuestsByUserAndDate(userId: string, date: string): Promise<Quest[]> {
    return this.questRepository.find({
      where: { userId, date },
      order: { createdAt: 'ASC' },
    });
  }

  async findQuestByUserTypeAndDate(
    userId: string,
    questType: QuestType,
    date: string,
  ): Promise<Quest | null> {
    return this.questRepository.findOne({
      where: { userId, questType, date },
    });
  }

  async countActiveHabitsByUser(userId: string): Promise<number> {
    return this.habitRepository.count({
      where: { userId, isActive: true },
    });
  }

  async countHabitLogsByUserAndDate(userId: string, date: string): Promise<number> {
    return this.habitLogRepository.count({
      where: { userId, date },
    });
  }

  async countHabitLogsByUserDateAndStatus(
    userId: string,
    date: string,
    status: HabitLogStatus,
  ): Promise<number> {
    return this.habitLogRepository.count({
      where: { userId, date, status },
    });
  }

  async findEarliestHabitLogByUserAndDate(userId: string, date: string): Promise<HabitLog | null> {
    const logs = await this.habitLogRepository.find({
      where: { userId, date },
      order: { createdAt: 'ASC' },
      take: 1,
    });
    return logs.length > 0 ? logs[0] : null;
  }
}
