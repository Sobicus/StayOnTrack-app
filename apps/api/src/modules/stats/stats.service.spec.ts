import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { ActivitiesService } from '../activities/services/activities.service';
import { Habit } from '../habits/entities/habit.entity';
import { ProfileVisibility } from '../users/entities/user.entity';

describe('StatsService', () => {
  let service: StatsService;
  let logRepository: any;
  let activitiesService: any;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

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
    logRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({ ...mockQueryBuilder }),
    };

    activitiesService = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: getRepositoryToken(HabitLog), useValue: logRepository },
        { provide: getRepositoryToken(Habit), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: ActivitiesService, useValue: activitiesService },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  describe('getUserStats', () => {
    it('should calculate totals from habit logs', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalSavedCalories: '1500',
          totalSavedMoney: '75.50',
          totalCheckIns: '30',
          totalDaysTracked: '15',
        }),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUserStats('user-1');

      expect(result.totalSavedCalories).toBe(1500);
      expect(result.totalSavedMoney).toBe(75.5);
      expect(result.totalCheckIns).toBe(30);
      expect(result.totalDaysTracked).toBe(15);
      // 1500 / 7700 = 0.19480519...  rounded to 3 decimals = 0.195
      expect(result.potentialWeightAvoidedKg).toBe(0.195);
    });

    it('should return zeros for user with no logs', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalSavedCalories: null,
          totalSavedMoney: null,
          totalCheckIns: '0',
          totalDaysTracked: '0',
        }),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb);

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
      // Set up getUserStats to return saved calories
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalSavedCalories: '500',
          totalSavedMoney: '25',
          totalCheckIns: '10',
          totalDaysTracked: '5',
        }),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb);

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
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalSavedCalories: '0',
          totalSavedMoney: '0',
          totalCheckIns: '0',
          totalDaysTracked: '0',
        }),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getEffortEquivalents('user-1');

      expect(result).toEqual([]);
    });

    it('should use default weight of 75kg when not specified', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalSavedCalories: '100',
          totalSavedMoney: '5',
          totalCheckIns: '2',
          totalDaysTracked: '1',
        }),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb);

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
      let callCount = 0;
      logRepository.createQueryBuilder.mockImplementation(() => {
        callCount++;
        return {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(
            callCount === 1
              ? { cal: '1000', money: '50' }  // past
              : { cal: '200', money: '10' },    // today
          ),
        };
      });

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
      logRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ cal: null, money: null }),
      });

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
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalSavedCalories: '770',
          totalSavedMoney: '38.5',
          totalCheckIns: '14',
          totalDaysTracked: '7',
        }),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getStatsByDateRange('user-1', '2026-03-01', '2026-03-07');

      expect(qb.where).toHaveBeenCalledWith('log.userId = :userId', { userId: 'user-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('log.date >= :startDate', { startDate: '2026-03-01' });
      expect(qb.andWhere).toHaveBeenCalledWith('log.date <= :endDate', { endDate: '2026-03-07' });
      expect(result.totalSavedCalories).toBe(770);
      expect(result.totalSavedMoney).toBe(38.5);
      expect(result.totalCheckIns).toBe(14);
      expect(result.totalDaysTracked).toBe(7);
      // 770 / 7700 = 0.1
      expect(result.potentialWeightAvoidedKg).toBe(0.1);
    });

    it('should return zeros for date range with no logs', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalSavedCalories: null,
          totalSavedMoney: null,
          totalCheckIns: '0',
          totalDaysTracked: '0',
        }),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getStatsByDateRange('user-1', '2025-01-01', '2025-01-07');

      expect(result.totalSavedCalories).toBe(0);
      expect(result.totalSavedMoney).toBe(0);
      expect(result.potentialWeightAvoidedKg).toBe(0);
      expect(result.totalCheckIns).toBe(0);
      expect(result.totalDaysTracked).toBe(0);
    });
  });
});
