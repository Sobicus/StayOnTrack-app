import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { HabitLogsService } from './habit-logs.service';
import { HabitLog, HabitLogStatus } from './entities/habit-log.entity';
import { HabitsService } from '../habits/habits.service';
import { GamificationService } from '../gamification/gamification.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { HabitFrequencyType } from '../habits/entities/habit.entity';

describe('HabitLogsService', () => {
  let service: HabitLogsService;
  let logRepository: any;
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
    logRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
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
        { provide: getRepositoryToken(HabitLog), useValue: logRepository },
        { provide: HabitsService, useValue: habitsService },
        { provide: GamificationService, useValue: { addXp: jest.fn().mockResolvedValue({ totalXp: 10, xpEarned: 10, levelUp: false, newLevel: 1 }) } },
        { provide: AnalyticsService, useValue: { trackEvent: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<HabitLogsService>(HabitLogsService);
  });

  describe('createLog', () => {
    it('should create a new log for a daily habit', async () => {
      logRepository.findOne.mockResolvedValue(null);

      const result = await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.AVOIDED,
        date: '2026-03-13',
      });

      expect(result).toBeDefined();
      expect(logRepository.create).toHaveBeenCalled();
      expect(logRepository.save).toHaveBeenCalled();
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
      logRepository.findOne.mockResolvedValue(existingLog);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.AVOIDED,
        date: '2026-03-13',
      });

      expect(logRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'log-existing',
          status: HabitLogStatus.AVOIDED,
          portionRatio: 0,
        }),
      );
    });

    it('should throw if portionRatio is missing for PARTIAL status', async () => {
      logRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createLog('user-1', {
          habitId: 'habit-1',
          status: HabitLogStatus.PARTIAL,
          date: '2026-03-13',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate saved calories correctly for AVOIDED', async () => {
      logRepository.findOne.mockResolvedValue(null);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.AVOIDED,
        date: '2026-03-13',
      });

      expect(logRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          savedCalories: 500, // 500 * (1 - 0)
          savedMoney: 5, // 5 * (1 - 0)
        }),
      );
    });

    it('should calculate saved calories correctly for PARTIAL', async () => {
      logRepository.findOne.mockResolvedValue(null);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.PARTIAL,
        portionRatio: 0.5,
        date: '2026-03-13',
      });

      expect(logRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          savedCalories: 250, // 500 * (1 - 0.5)
          savedMoney: 2.5, // 5 * (1 - 0.5)
        }),
      );
    });

    it('should calculate zero savings for CONSUMED', async () => {
      logRepository.findOne.mockResolvedValue(null);

      await service.createLog('user-1', {
        habitId: 'habit-1',
        status: HabitLogStatus.CONSUMED,
        date: '2026-03-13',
      });

      expect(logRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          savedCalories: 0,
          savedMoney: 0,
        }),
      );
    });
  });

  describe('frequency enforcement', () => {
    it('should allow check-in for daily habits without limits', async () => {
      logRepository.findOne.mockResolvedValue(null);
      logRepository.count.mockResolvedValue(5);

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
      logRepository.findOne.mockResolvedValue(null); // No existing log for today
      logRepository.count.mockResolvedValue(2); // Already 2 this week

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
      logRepository.findOne.mockResolvedValue(null);
      logRepository.count.mockResolvedValue(1); // Only 1 this week, limit is 3

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
      logRepository.findOne.mockResolvedValue(null);
      logRepository.count.mockResolvedValue(4); // Already 4 this week

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
      logRepository.count.mockResolvedValue(1);

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
