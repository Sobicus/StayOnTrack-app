import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { HabitsService } from './services/habits.service';
import { Habit, HabitCategory, HabitFrequencyType, HabitType } from './entities/habit.entity';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { HabitsQueryRepository } from './repositories/habits.query.repository';
import { HabitsCommandRepository } from './repositories/habits.command.repository';

describe('HabitsService', () => {
  let service: HabitsService;
  let queryRepo: any;
  let commandRepo: any;

  const mockHabit: Partial<Habit> = {
    id: 'habit-1',
    userId: 'user-1',
    title: 'No Sweets',
    emoji: '🍬',
    category: HabitCategory.SWEETS,
    habitType: HabitType.AVOIDANCE,
    caloriesPerOccurrence: 500,
    pricePerOccurrence: 5,
    frequencyType: HabitFrequencyType.DAILY,
    occurrencesPerWeek: null,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    queryRepo = {
      findAllByUser: jest.fn().mockResolvedValue([mockHabit]),
      findActiveByUser: jest.fn().mockResolvedValue([mockHabit]),
      findOneById: jest.fn().mockResolvedValue(mockHabit),
      getTemplates: jest.fn().mockResolvedValue([]),
      getMaxSortOrder: jest.fn().mockResolvedValue(2),
    };

    commandRepo = {
      create: jest.fn((data) => ({ ...data, id: 'habit-new', createdAt: new Date(), updatedAt: new Date() })),
      save: jest.fn((data) => Promise.resolve(data)),
      remove: jest.fn().mockResolvedValue(undefined),
      updateSortOrder: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitsService,
        { provide: HabitsQueryRepository, useValue: queryRepo },
        { provide: HabitsCommandRepository, useValue: commandRepo },
        { provide: AnalyticsService, useValue: { trackEvent: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<HabitsService>(HabitsService);
  });

  describe('findAllByUser', () => {
    it('should return all habits for a user', async () => {
      const result = await service.findAllByUser('user-1');

      expect(queryRepo.findAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockHabit]);
    });

    it('should return empty array for user with no habits', async () => {
      queryRepo.findAllByUser.mockResolvedValue([]);

      const result = await service.findAllByUser('user-no-habits');

      expect(result).toEqual([]);
    });
  });

  describe('findActiveByUser', () => {
    it('should return only active habits', async () => {
      await service.findActiveByUser('user-1');

      expect(queryRepo.findActiveByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('create', () => {
    it('should create a habit with correct fields and auto-calculated sortOrder', async () => {
      const dto = {
        title: 'No Soda',
        emoji: '🥤',
        category: HabitCategory.DRINKS,
        caloriesPerOccurrence: 200,
        pricePerOccurrence: 2,
      };

      const result = await service.create('user-1', dto);

      expect(queryRepo.getMaxSortOrder).toHaveBeenCalledWith('user-1');
      expect(commandRepo.create).toHaveBeenCalledWith({
        ...dto,
        userId: 'user-1',
        sortOrder: 3, // max (2) + 1
      });
      expect(commandRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should set sortOrder to 0 when user has no existing habits', async () => {
      queryRepo.getMaxSortOrder.mockResolvedValue(null);

      await service.create('user-1', { title: 'First Habit' });

      expect(commandRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 0 }),
      );
    });
  });

  describe('findOneByUser', () => {
    it('should return a habit owned by the user', async () => {
      const result = await service.findOneByUser('habit-1', 'user-1');

      expect(result).toEqual(mockHabit);
    });

    it('should throw NotFoundException for non-existent habit', async () => {
      queryRepo.findOneById.mockResolvedValue(null);

      await expect(
        service.findOneByUser('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing another user\'s habit', async () => {
      await expect(
        service.findOneByUser('habit-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update habit fields', async () => {
      const dto = { title: 'Updated Title', caloriesPerOccurrence: 300 };

      const result = await service.update('habit-1', 'user-1', dto);

      expect(commandRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          caloriesPerOccurrence: 300,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when updating non-existent habit', async () => {
      queryRepo.findOneById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-1', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating another user\'s habit', async () => {
      await expect(
        service.update('habit-1', 'user-2', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove the habit', async () => {
      await service.remove('habit-1', 'user-1');

      expect(commandRepo.remove).toHaveBeenCalledWith(mockHabit);
    });

    it('should throw NotFoundException for non-existent habit', async () => {
      queryRepo.findOneById.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deleting another user\'s habit', async () => {
      await expect(
        service.remove('habit-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reorder', () => {
    it('should update sort orders for provided habit IDs', async () => {
      queryRepo.findAllByUser.mockResolvedValue([
        { ...mockHabit, id: 'habit-1' },
        { ...mockHabit, id: 'habit-2' },
      ]);

      const result = await service.reorder('user-1', ['habit-2', 'habit-1']);

      expect(commandRepo.updateSortOrder).toHaveBeenCalledTimes(2);
      expect(commandRepo.updateSortOrder).toHaveBeenCalledWith('habit-2', 'user-1', 0);
      expect(commandRepo.updateSortOrder).toHaveBeenCalledWith('habit-1', 'user-1', 1);
    });

    it('should throw ForbiddenException if habit ID does not belong to user', async () => {
      queryRepo.findAllByUser.mockResolvedValue([{ ...mockHabit, id: 'habit-1' }]);

      await expect(
        service.reorder('user-1', ['habit-1', 'habit-foreign']),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
