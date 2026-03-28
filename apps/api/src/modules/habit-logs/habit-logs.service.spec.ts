import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HabitLogsService } from './services/habit-logs.service';
import { HabitLogStatus } from './entities/habit-log.entity';
import { HabitsService } from '../habits/services/habits.service';
import { GamificationService } from '../gamification/services/gamification.service';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { HabitFrequencyType } from '../habits/entities/habit.entity';
import { HabitLogsQueryRepository } from './repositories/habit-logs.query.repository';
import { HabitLogsCommandRepository } from './repositories/habit-logs.command.repository';

describe('HabitLogsService', () => {
  let service: HabitLogsService;
  let queryRepo: any;
  let commandRepo: any;
  let habitsService: any;

  const mockHabit = {
    id: 'habit-1',
    userId: 'user-1',
    title: 'Test Habit',
    caloriesPerOccurrence: 500,
    pricePerOccurrence: 5,
    frequencyType: HabitFrequencyType.DAILY,
    occurrencesPerWeek: null,
    isActive: true,
  };

  beforeEach(async () => {
    queryRepo = {
      findByHabitAndDate: jest.fn(),
      findByUserAndDate: jest.fn(),
      findByDateRange: jest.fn(),
      findByHabit: jest.fn(),
      findOne: jest.fn(),
      countByHabitAndDateRange: jest.fn(),
    };

    commandRepo = {
      create: jest.fn((data) => ({ ...data, id: 'log-1', createdAt: new Date() })),
      save: jest.fn((data) => Promise.resolve({ ...data, id: data.id || 'log-1' })),
      remove: jest.fn(),
    };

    habitsService = {
      findOneByUser: jest.fn().mockResolvedValue(mockHabit),
      findActiveByUser: jest.fn().mockResolvedValue([mockHabit]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitLogsService,
        { provide: HabitLogsQueryRepository, useValue: queryRepo },
        { provide: HabitLogsCommandRepository, useValue: commandRepo },
        { provide: HabitsService, useValue: habitsService },
        { provide: GamificationService, useValue: { addXp: jest.fn().mockResolvedValue({ totalXp: 10, xpEarned: 10, levelUp: false, newLevel: 1 }) } },
        { provide: AnalyticsService, useValue: { trackEvent: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<HabitLogsService>(HabitLogsService);
  });

  describe('createLog', () => {
    it('should create a new log for a daily habit', async () => {
      queryRepo.findByHabitAndDate.mockResolvedValue(null);

      const result = await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.AVOIDED,
        date: '2026-03-13',
      });

      expect(result).toBeDefined();
      expect(commandRepo.create).toHaveBeenCalled();
      expect(commandRepo.save).toHaveBeenCalled();
    });

    it('should update an existing log if one exists for the same date', async () => {
      const existingLog = {
        id: 'log-existing',
        habitId: 'habit-1',
        date: '2026-03-13',
        status: HabitLogStatus.CONSUMED,
        portionRatio: 1,
        savedCalories: 0,
        savedMoney: 0,
      };
      queryRepo.findByHabitAndDate.mockResolvedValue(existingLog);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.AVOIDED,
        date: '2026-03-13',
      });

      expect(commandRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'log-existing',
          status: HabitLogStatus.AVOIDED,
          portionRatio: 0,
        }),
      );
    });

    it('should throw if portionRatio is missing for PARTIAL status', async () => {
      queryRepo.findByHabitAndDate.mockResolvedValue(null);

      await expect(
        service.createLog('user-1', {
          habitId: 'habit-1',
          status: HabitLogStatus.PARTIAL,
          date: '2026-03-13',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate saved calories correctly for AVOIDED', async () => {
      queryRepo.findByHabitAndDate.mockResolvedValue(null);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.AVOIDED,
        date: '2026-03-13',
      });

      expect(commandRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          savedCalories: 500, // 500 * (1 - 0)
          savedMoney: 5, // 5 * (1 - 0)
        }),
      );
    });

    it('should calculate saved calories correctly for PARTIAL', async () => {
      queryRepo.findByHabitAndDate.mockResolvedValue(null);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.PARTIAL,
        portionRatio: 0.5,
        date: '2026-03-13',
      });

      expect(commandRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          savedCalories: 250, // 500 * (1 - 0.5)
          savedMoney: 2.5, // 5 * (1 - 0.5)
        }),
      );
    });

    it('should calculate zero savings for CONSUMED', async () => {
      queryRepo.findByHabitAndDate.mockResolvedValue(null);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.CONSUMED,
        date: '2026-03-13',
      });

      expect(commandRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          savedCalories: 0,
          savedMoney: 0,
        }),
      );
    });
  });

  describe('frequency enforcement', () => {
    it('should allow check-in for daily habits without limits', async () => {
      queryRepo.findByHabitAndDate.mockResolvedValue(null);
      queryRepo.countByHabitAndDateRange.mockResolvedValue(5);

      await expect(
        service.createLog('user-1', {
          habitId: 'habit-1',
          status: HabitLogStatus.AVOIDED,
          date: '2026-03-13',
        }),
      ).resolves.toBeDefined();
    });

    it('should reject check-in when weekly limit is reached', async () => {
      const weeklyHabit = {
        ...mockHabit,
        frequencyType: HabitFrequencyType.WEEKLY,
        occurrencesPerWeek: 2,
      };
      habitsService.findOneByUser.mockResolvedValue(weeklyHabit);
      queryRepo.findByHabitAndDate.mockResolvedValue(null); // No existing log for today
      queryRepo.countByHabitAndDateRange.mockResolvedValue(2); // Already 2 this week

      await expect(
        service.createLog('user-1', {
          habitId: 'habit-1',
          status: HabitLogStatus.AVOIDED,
          date: '2026-03-13',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow check-in when weekly limit is not reached', async () => {
      const weeklyHabit = {
        ...mockHabit,
        frequencyType: HabitFrequencyType.WEEKLY,
        occurrencesPerWeek: 3,
      };
      habitsService.findOneByUser.mockResolvedValue(weeklyHabit);
      queryRepo.findByHabitAndDate.mockResolvedValue(null);
      queryRepo.countByHabitAndDateRange.mockResolvedValue(1); // Only 1 this week, limit is 3

      await expect(
        service.createLog('user-1', {
          habitId: 'habit-1',
          status: HabitLogStatus.AVOIDED,
          date: '2026-03-13',
        }),
      ).resolves.toBeDefined();
    });

    it('should enforce custom frequency limits', async () => {
      const customHabit = {
        ...mockHabit,
        frequencyType: HabitFrequencyType.CUSTOM,
        occurrencesPerWeek: 4,
      };
      habitsService.findOneByUser.mockResolvedValue(customHabit);
      queryRepo.findByHabitAndDate.mockResolvedValue(null);
      queryRepo.countByHabitAndDateRange.mockResolvedValue(4); // Already 4 this week

      await expect(
        service.createLog('user-1', {
          habitId: 'habit-1',
          status: HabitLogStatus.AVOIDED,
          date: '2026-03-13',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFrequencyStatus', () => {
    it('should return null limits for daily habits', async () => {
      const result = await service.getFrequencyStatus('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        habitId: 'habit-1',
        used: 0,
        limit: null,
        remaining: null,
      });
    });

    it('should return correct usage for weekly habits', async () => {
      const weeklyHabit = {
        ...mockHabit,
        frequencyType: HabitFrequencyType.WEEKLY,
        occurrencesPerWeek: 3,
      };
      habitsService.findActiveByUser.mockResolvedValue([weeklyHabit]);
      queryRepo.countByHabitAndDateRange.mockResolvedValue(1);

      const result = await service.getFrequencyStatus('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        habitId: 'habit-1',
        used: 1,
        limit: 3,
        remaining: 2,
      });
    });
  });
});
