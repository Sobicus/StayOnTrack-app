import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from './entities/habit.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async create(userId: string, dto: CreateHabitDto): Promise<Habit> {
    // Get the next sort order for this user
    const maxSortOrder = await this.habitRepository
      .createQueryBuilder('habit')
      .select('MAX(habit.sortOrder)', 'max')
      .where('habit.userId = :userId', { userId })
      .getRawOne();

    const habit = this.habitRepository.create({
      ...dto,
      userId,
      sortOrder: (maxSortOrder?.max ?? -1) + 1,
    });

    const saved = await this.habitRepository.save(habit);

    this.analyticsService
      .trackEvent(userId, 'habit_created', { habitId: saved.id, category: dto.category })
      .catch(() => {});

    return saved;
  }

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

  async findOneByUser(habitId: string, userId: string): Promise<Habit> {
    const habit = await this.habitRepository.findOne({
      where: { id: habitId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException('You do not own this habit');
    }

    return habit;
  }

  async update(
    habitId: string,
    userId: string,
    dto: UpdateHabitDto,
  ): Promise<Habit> {
    const habit = await this.findOneByUser(habitId, userId);

    Object.assign(habit, dto);

    return this.habitRepository.save(habit);
  }

  async remove(habitId: string, userId: string): Promise<void> {
    const habit = await this.findOneByUser(habitId, userId);
    await this.habitRepository.remove(habit);
  }

  async reorder(
    userId: string,
    habitIds: string[],
  ): Promise<Habit[]> {
    // Verify all habits belong to user
    const habits = await this.findAllByUser(userId);
    const userHabitIds = new Set(habits.map((h) => h.id));

    for (const id of habitIds) {
      if (!userHabitIds.has(id)) {
        throw new ForbiddenException(`Habit ${id} does not belong to you`);
      }
    }

    // Update sort orders
    const updates = habitIds.map((id, index) =>
      this.habitRepository.update(
        { id, userId },
        { sortOrder: index },
      ),
    );

    await Promise.all(updates);

    return this.findAllByUser(userId);
  }
}
