import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './services/stats.service';
import { ActivitiesService } from '../activities/services/activities.service';
import { ProfileVisibility } from '../users/entities/user.entity';
import { StatsQueryRepository } from './repositories/stats.query.repository';

describe('StatsService', () => {
  let service: StatsService;
  let statsQueryRepository: any;
  let activitiesService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hash',
    avatarUrl: null,
    weightKg: 75,
    heightCm: 180,
    goal: null,
    visibility: ProfileVisibility.PRIVATE,
    locale: 'en',
    streakShieldsRemaining: 1,
    dayEndHour: 0,
    currency: 'EUR',
    weekStartDay: 'monday',
    onboardingCompleted: false,
    refreshTokenHash: null,
    passwordResetTokenHash: null,
    passwordResetExpires: null,
    lastShieldReplenishDate: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    statsQueryRepository = {
      getAggregatedStats: jest.fn(),
      getAggregatedStatsByDateRange: jest.fn(),
      getPastDaysSums: jest.fn(),
      getDaySums: jest.fn(),
      getWeeklyTrendRows: jest.fn(),
      findAllLogsByUser: jest.fn(),
      findLogsByDateRange: jest.fn(),
      findHabitsByUser: jest.fn().mockResolvedValue([]),
    };

    activitiesService = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: StatsQueryRepository, useValue: statsQueryRepository },
        { provide: ActivitiesService, useValue: activitiesService },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  describe('getUserStats', () => {
    it('should calculate totals from habit logs', async () => {
      statsQueryRepository.getAggregatedStats.mockResolvedValue({
        totalSavedCalories: '1500',
        totalSavedMoney: '75.50',
        totalCheckIns: '30',
        totalDaysTracked: '15',
      });

      const result = await service.getUserStats('user-1');

      expect(result.totalSavedCalories).toBe(1500);
      expect(result.totalSavedMoney).toBe(75.5);
      expect(result.totalCheckIns).toBe(30);
      expect(result.totalDaysTracked).toBe(15);
      // 1500 / 7700 = 0.19480519...  rounded to 3 decimals = 0.195
      expect(result.potentialWeightAvoidedKg).toBe(0.195);
    });

    it('should return zeros for user with no logs', async () => {
      statsQueryRepository.getAggregatedStats.mockResolvedValue({
        totalSavedCalories: null,
        totalSavedMoney: null,
        totalCheckIns: '0',
        totalDaysTracked: '0',
      });

      const result = await service.getUserStats('user-no-logs');

      expect(result.totalSavedCalories).toBe(0);
      expect(result.totalSavedMoney).toBe(0);
      expect(result.potentialWeightAvoidedKg).toBe(0);
      expect(result.totalCheckIns).toBe(0);
      expect(result.totalDaysTracked).toBe(0);
    });
  });

  describe('getEffortEquivalents', () => {
    it('should return activity-based equivalents', async () => {
      statsQueryRepository.getAggregatedStats.mockResolvedValue({
        totalSavedCalories: '500',
        totalSavedMoney: '25',
        totalCheckIns: '10',
        totalDaysTracked: '5',
      });

      activitiesService.findAll.mockResolvedValue([
        {
          slug: 'running-moderate',
          name: 'Running (moderate)',
          unit: 'MINUTE',
          met: 8.0,
          caloriesPerUnitBase: 9.33,
          baseWeightKg: 75,
        },
        {
          slug: 'pushups',
          name: 'Push-ups',
          unit: 'REP',
          met: null,
          caloriesPerUnitBase: 0.36,
          baseWeightKg: 75,
        },
      ]);

      const result = await service.getEffortEquivalents('user-1', 75);

      expect(result).toHaveLength(2);

      // Running: caloriesPerMinute = (8.0 * 3.5 * 75) / 200 = 10.5
      // amount = 500 / 10.5 = 47.619... => 47.6
      const running = result.find((r) => r.activitySlug === 'running-moderate');
      expect(running).toBeDefined();
      expect(running!.unit).toBe('minutes');
      expect(running!.amount).toBe(47.6);

      // Push-ups: caloriesPerRep = 0.36 * (75 / 75) = 0.36
      // amount = 500 / 0.36 = 1388.888... => 1388.9
      const pushups = result.find((r) => r.activitySlug === 'pushups');
      expect(pushups).toBeDefined();
      expect(pushups!.unit).toBe('reps');
      expect(pushups!.amount).toBe(1388.9);
    });

    it('should return empty array when no saved calories', async () => {
      statsQueryRepository.getAggregatedStats.mockResolvedValue({
        totalSavedCalories: '0',
        totalSavedMoney: '0',
        totalCheckIns: '0',
        totalDaysTracked: '0',
      });

      const result = await service.getEffortEquivalents('user-1');

      expect(result).toEqual([]);
    });

    it('should use default weight of 75kg when not specified', async () => {
      statsQueryRepository.getAggregatedStats.mockResolvedValue({
        totalSavedCalories: '100',
        totalSavedMoney: '5',
        totalCheckIns: '2',
        totalDaysTracked: '1',
      });

      activitiesService.findAll.mockResolvedValue([
        {
          slug: 'running-moderate',
          name: 'Running (moderate)',
          unit: 'MINUTE',
          met: 8.0,
          caloriesPerUnitBase: 9.33,
          baseWeightKg: 75,
        },
      ]);

      // Call without explicit weight — should use default 75
      const result = await service.getEffortEquivalents('user-1');

      expect(result).toHaveLength(1);
      // With 75kg default: (8.0 * 3.5 * 75) / 200 = 10.5
      // 100 / 10.5 = 9.5238 => 9.5
      expect(result[0].amount).toBe(9.5);
    });
  });

  describe('getLiveStats', () => {
    it('should return past and today stats separately', async () => {
      statsQueryRepository.getPastDaysSums.mockResolvedValue({ cal: '1000', money: '50' });
      statsQueryRepository.getDaySums.mockResolvedValue({ cal: '200', money: '10' });

      const result = await service.getLiveStats(mockUser as any);

      expect(result.pastCalories).toBe(1000);
      expect(result.pastMoney).toBe(50);
      expect(result.pastWeightKg).toBe(parseFloat((1000 / 7700).toFixed(3)));
      expect(result.todayCalories).toBe(200);
      expect(result.todayMoney).toBe(10);
      expect(result.todayExpectedCalories).toBe(200);
      expect(result.todayExpectedMoney).toBe(10);
      expect(result.dayEndHour).toBe(0);
      expect(result.startedAt).toBe(mockUser.createdAt.toISOString());
    });

    it('should return zeros when user has no logs', async () => {
      statsQueryRepository.getPastDaysSums.mockResolvedValue({ cal: null, money: null });
      statsQueryRepository.getDaySums.mockResolvedValue({ cal: null, money: null });

      const result = await service.getLiveStats(mockUser as any);

      expect(result.pastCalories).toBe(0);
      expect(result.pastMoney).toBe(0);
      expect(result.pastWeightKg).toBe(0);
      expect(result.todayCalories).toBe(0);
      expect(result.todayMoney).toBe(0);
    });
  });

  describe('getStatsByDateRange', () => {
    it('should return stats filtered by date range', async () => {
      statsQueryRepository.getAggregatedStatsByDateRange.mockResolvedValue({
        totalSavedCalories: '770',
        totalSavedMoney: '38.5',
        totalCheckIns: '14',
        totalDaysTracked: '7',
      });

      const result = await service.getStatsByDateRange({ userId: 'user-1', startDate: '2026-03-01', endDate: '2026-03-07' });

      expect(statsQueryRepository.getAggregatedStatsByDateRange).toHaveBeenCalledWith(
        'user-1',
        '2026-03-01',
        '2026-03-07',
      );
      expect(result.totalSavedCalories).toBe(770);
      expect(result.totalSavedMoney).toBe(38.5);
      expect(result.totalCheckIns).toBe(14);
      expect(result.totalDaysTracked).toBe(7);
      // 770 / 7700 = 0.1
      expect(result.potentialWeightAvoidedKg).toBe(0.1);
    });

    it('should return zeros for date range with no logs', async () => {
      statsQueryRepository.getAggregatedStatsByDateRange.mockResolvedValue({
        totalSavedCalories: null,
        totalSavedMoney: null,
        totalCheckIns: '0',
        totalDaysTracked: '0',
      });

      const result = await service.getStatsByDateRange({ userId: 'user-1', startDate: '2025-01-01', endDate: '2025-01-07' });

      expect(result.totalSavedCalories).toBe(0);
      expect(result.totalSavedMoney).toBe(0);
      expect(result.potentialWeightAvoidedKg).toBe(0);
      expect(result.totalCheckIns).toBe(0);
      expect(result.totalDaysTracked).toBe(0);
    });
  });
});
