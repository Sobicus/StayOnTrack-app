import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Habit } from '../entities/habit.entity';
import { HabitTemplate } from '../entities/habit-template.entity';
import { CreateHabitDto } from '../dto/create-habit.dto';
import { UpdateHabitDto } from '../dto/update-habit.dto';
import { AnalyticsService } from '../../analytics/services/analytics.service';
import { HabitsQueryRepository } from '../repositories/habits.query.repository';
import { HabitsCommandRepository } from '../repositories/habits.command.repository';
import { HabitNotFoundException, HabitNotOwnedException } from '../../../common/exceptions/habit.exception';

@Injectable()
export class HabitsService {
  constructor(
    private readonly queryRepo: HabitsQueryRepository,
    private readonly commandRepo: HabitsCommandRepository,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getTemplates(): Promise<HabitTemplate[]> {
    return this.queryRepo.getTemplates();
  }

  async create(userId: string, dto: CreateHabitDto): Promise<Habit> {
    // Get the next sort order for this user
    const maxSortOrder = await this.queryRepo.getMaxSortOrder(userId);

    const habit = this.commandRepo.create({
      ...dto,
      userId,
      sortOrder: (maxSortOrder ?? -1) + 1,
    });

    const saved = await this.commandRepo.save(habit);

    this.analyticsService
      .trackEvent(userId, 'habit_created', { habitId: saved.id, category: dto.category })
      .catch(() => {});

    return saved;
  }

  async findAllByUser(userId: string): Promise<Habit[]> {
    return this.queryRepo.findAllByUser(userId);
  }

  async findActiveByUser(userId: string): Promise<Habit[]> {
    return this.queryRepo.findActiveByUser(userId);
  }

  async findOneByUser(habitId: string, userId: string): Promise<Habit> {
    const habit = await this.queryRepo.findOneById(habitId);

    if (!habit) {
      throw new HabitNotFoundException(habitId);
    }

    if (habit.userId !== userId) {
      throw new HabitNotOwnedException();
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

    return this.commandRepo.save(habit);
  }

  async remove(habitId: string, userId: string): Promise<void> {
    const habit = await this.findOneByUser(habitId, userId);
    await this.commandRepo.softDelete(habit);
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
      this.commandRepo.updateSortOrder(id, userId, index),
    );

    await Promise.all(updates);

    return this.findAllByUser(userId);
  }
}
