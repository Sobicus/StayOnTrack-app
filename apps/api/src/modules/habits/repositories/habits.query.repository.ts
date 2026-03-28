import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../entities/habit.entity';
import { HabitTemplate } from '../entities/habit-template.entity';

@Injectable()
export class HabitsQueryRepository {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    @InjectRepository(HabitTemplate)
    private readonly templateRepository: Repository<HabitTemplate>,
  ) {}

  async findAllByUser(userId: string): Promise<Habit[]> {
    return this.habitRepository.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findActiveByUser(userId: string): Promise<Habit[]> {
    return this.habitRepository.find({
      where: { userId, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneById(habitId: string): Promise<Habit | null> {
    return this.habitRepository.findOne({
      where: { id: habitId },
    });
  }

  async getTemplates(): Promise<HabitTemplate[]> {
    return this.templateRepository.find({ order: { category: 'ASC', sortOrder: 'ASC' } });
  }

  async getMaxSortOrder(userId: string): Promise<number | null> {
    const result = await this.habitRepository
      .createQueryBuilder('habit')
      .select('MAX(habit.sortOrder)', 'max')
      .where('habit.userId = :userId', { userId })
      .getRawOne();
    return result?.max ?? null;
  }
}
