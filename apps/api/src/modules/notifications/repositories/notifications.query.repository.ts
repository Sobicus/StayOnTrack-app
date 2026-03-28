import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HabitLog } from '../../habit-logs/entities/habit-log.entity';
import { Habit } from '../../habits/entities/habit.entity';

@Injectable()
export class NotificationsQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(HabitLog)
    private readonly habitLogRepo: Repository<HabitLog>,
    @InjectRepository(Habit)
    private readonly habitRepo: Repository<Habit>,
  ) {}

  async findUsersWithRemindersEnabled(): Promise<User[]> {
    return this.userRepo.find({
      where: { emailReminders: true },
    });
  }

  async countHabitLogsByUserAndDate(userId: string, date: string): Promise<number> {
    return this.habitLogRepo.count({
      where: { userId, date },
    });
  }

  async findHabitLogsByUserSinceDate(userId: string, startDate: string): Promise<HabitLog[]> {
    return this.habitLogRepo.find({
      where: {
        userId,
        date: MoreThanOrEqual(startDate),
      },
    });
  }

  async findHabitById(habitId: string): Promise<Habit | null> {
    return this.habitRepo.findOne({
      where: { id: habitId },
    });
  }

  async countActiveHabitsByUser(userId: string): Promise<number> {
    return this.habitRepo.count({
      where: { userId, isActive: true },
    });
  }
}
