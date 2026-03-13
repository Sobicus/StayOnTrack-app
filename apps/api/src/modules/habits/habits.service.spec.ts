import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { Habit, HabitCategory, HabitFrequencyType, HabitType } from './entities/habit.entity';
import { AnalyticsService } from '../analytics/analytics.service';

describe('HabitsService', () => {
  let service: HabitsService;
  let habitRepository: any;

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
    habitRepository = {
      create: jest.fn((data) => ({ ...data, id: 'habit-new', createdAt: new Date(), updatedAt: new Date() })),
      save: jest.fn((data) => Promise.resolve(data)),
      find: jest.fn().mockResolvedValue([mockHabit]),
      findOne: jest.fn().mockResolvedValue(mockHabit),
      remove: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 2 }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitsService,
        { provide: getRepositoryToken(Habit), useValue: habitRepository },
        { provide: AnalyticsService, useValue: { trackEvent: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<HabitsService>(HabitsService);
  });

  describe('findAllByUser', () => {
    it('should return all habits for a user', async () => {
      const result = await service.findAllByUser('user-1');

      expect(habitRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toEqual([mockHabit]);
    });

    it('should return empty array for user with no habits', async () => {
      habitRepository.find.mockResolvedValue([]);

      const result = await service.findAllByUser('user-no-habits');

      expect(result).toEqual([]);
    });
  });

  describe('findActiveByUser', () => {
    it('should return only active habits', async () => {
      await service.findActiveByUser('user-1');

      expect(habitRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
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

      expect(habitRepository.createQueryBuilder).toHaveBeenCalledWith('habit');
      expect(habitRepository.create).toHaveBeenCalledWith({
        ...dto,
        userId: 'user-1',
        sortOrder: 3, // max (2) + 1
      });
      expect(habitRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should set sortOrder to 0 when user has no existing habits', async () => {
      habitRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      });

      await service.create('user-1', { title: 'First Habit' });

      expect(habitRepository.create).toHaveBeenCalledWith(
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
      habitRepository.findOne.mockResolvedValue(null);

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

      expect(habitRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          caloriesPerOccurrence: 300,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when updating non-existent habit', async () => {
      habitRepository.findOne.mockResolvedValue(null);

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

      expect(habitRepository.remove).toHaveBeenCalledWith(mockHabit);
    });

    it('should throw NotFoundException for non-existent habit', async () => {
      habitRepository.findOne.mockResolvedValue(null);

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
      habitRepository.find.mockResolvedValue([
        { ...mockHabit, id: 'habit-1' },
        { ...mockHabit, id: 'habit-2' },
      ]);

      const result = await service.reorder('user-1', ['habit-2', 'habit-1']);

      expect(habitRepository.update).toHaveBeenCalledTimes(2);
      expect(habitRepository.update).toHaveBeenCalledWith(
        { id: 'habit-2', userId: 'user-1' },
        { sortOrder: 0 },
      );
      expect(habitRepository.update).toHaveBeenCalledWith(
        { id: 'habit-1', userId: 'user-1' },
        { sortOrder: 1 },
      );
    });

    it('should throw ForbiddenException if habit ID does not belong to user', async () => {
      habitRepository.find.mockResolvedValue([{ ...mockHabit, id: 'habit-1' }]);

      await expect(
        service.reorder('user-1', ['habit-1', 'habit-foreign']),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
