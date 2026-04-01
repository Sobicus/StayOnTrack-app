import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../entities/habit.entity';

@Injectable()
export class HabitsCommandRepository {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
  ) {}

  create(data: Partial<Habit>): Habit {
    return this.habitRepository.create(data);
  }

  async save(habit: Habit): Promise<Habit> {
    return this.habitRepository.save(habit);
  }

  async remove(habit: Habit): Promise<void> {
    await this.habitRepository.remove(habit);
  }

  async softDelete(habit: Habit): Promise<void> {
    await this.habitRepository.softRemove(habit);
  }

  async updateSortOrder(habitId: string, userId: string, sortOrder: number): Promise<void> {
    await this.habitRepository.update(
      { id: habitId, userId },
      { sortOrder },
    );
  }
}
