import { Test, TestingModule } from '@nestjs/testing';
import { StreaksService } from './services/streaks.service';
import { HabitLogStatus } from '../habit-logs/entities/habit-log.entity';
import { User } from '../users/entities/user.entity';
import { HabitsService } from '../habits/services/habits.service';
import { GamificationService } from '../gamification/services/gamification.service';
import { STREAK_SHIELDS_PER_WEEK } from '@stayontrack/contracts';
import { StreaksQueryRepository } from './repositories/streaks.query.repository';
import { StreaksCommandRepository } from './repositories/streaks.command.repository';

describe('StreaksService', () => {
  let service: StreaksService;
  let streaksQueryRepo: any;
  let streaksCommandRepo: any;
  let habitsService: any;
  let gamificationService: any;

  // Helper to format dates as YYYY-MM-DD
  const toDateStr = (d: Date): string => d.toISOString().split('T')[0];
  const today = toDateStr(new Date());
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateStr(d);
  })();
  const twoDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return toDateStr(d);
  })();
  const threeDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return toDateStr(d);
  })();

  const mockUser: Partial<User> = {
    id: 'user-1',
    streakShieldsRemaining: 1,
    lastShieldReplenishDate: null,
  };

  const mockActiveHabits = [
    { id: 'habit-1', name: 'No Sweets', isActive: true },
  ];

  beforeEach(async () => {
    streaksQueryRepo = {
      getDistinctDatesDesc: jest.fn().mockResolvedValue([]),
      getDistinctDatesAsc: jest.fn().mockResolvedValue([]),
      getMostRecentDate: jest.fn().mockResolvedValue([]),
      getLogsByDate: jest.fn().mockResolvedValue([]),
      findUser: jest.fn().mockResolvedValue({ ...mockUser }),
    };

    streaksCommandRepo = {
      saveUser: jest.fn((data) => Promise.resolve(data)),
      createLog: jest.fn((data) => data),
      saveLogs: jest.fn((data) => Promise.resolve(data)),
    };

    habitsService = {
      findActiveByUser: jest.fn().mockResolvedValue(mockActiveHabits),
    };

    gamificationService = {
      addXp: jest.fn().mockResolvedValue({ totalXp: 100, xpEarned: 100, levelUp: false, newLevel: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreaksService,
        { provide: StreaksQueryRepository, useValue: streaksQueryRepo },
        { provide: StreaksCommandRepository, useValue: streaksCommandRepo },
        { provide: HabitsService, useValue: habitsService },
        { provide: GamificationService, useValue: gamificationService },
      ],
    }).compile();

    service = module.get<StreaksService>(StreaksService);
  });

  describe('getStreak', () => {
    it('should return zero streak when user not found', async () => {
      streaksQueryRepo.findUser.mockResolvedValue(null);

      const result = await service.getStreak('user-1');

      expect(result).toEqual({
        currentStreak: 0,
        bestStreak: 0,
        streakShieldsRemaining: 0,
        lastCheckinDate: null,
        isShieldActive: false,
      });
    });

    it('should return zero streak when no check-in dates exist', async () => {
      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue([]);

      const result = await service.getStreak('user-1');

      expect(result.currentStreak).toBe(0);
      expect(result.bestStreak).toBe(0);
      expect(result.lastCheckinDate).toBeNull();
    });

    it('should return zero streak when no active habits exist', async () => {
      habitsService.findActiveByUser.mockResolvedValue([]);
      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue([{ date: today }]);

      const result = await service.getStreak('user-1');

      expect(result.currentStreak).toBe(0);
      expect(result.bestStreak).toBe(0);
    });

    it('should return current streak for consecutive successful days', async () => {
      // Set up 3 consecutive days of check-ins (today, yesterday, twoDaysAgo)
      const dates = [
        { date: today },
        { date: yesterday },
        { date: twoDaysAgo },
      ];

      // First call: DESC order for current streak calculation
      // Second call: ASC order for best streak calculation
      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue(dates);
      streaksQueryRepo.getDistinctDatesAsc.mockResolvedValue([...dates].reverse());

      // All days are successful (AVOIDED status)
      streaksQueryRepo.getLogsByDate.mockResolvedValue([
        {
          status: HabitLogStatus.AVOIDED,
          portionRatio: 0,
        },
      ]);

      const result = await service.getStreak('user-1');

      expect(result.currentStreak).toBe(3);
      expect(result.bestStreak).toBe(3);
      expect(result.lastCheckinDate).toBe(today);
    });

    it('should reset streak when last check-in was more than 1 day ago', async () => {
      const dates = [{ date: threeDaysAgo }];

      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue(dates);
      streaksQueryRepo.getDistinctDatesAsc.mockResolvedValue(dates);

      streaksQueryRepo.getLogsByDate.mockResolvedValue([
        { status: HabitLogStatus.AVOIDED, portionRatio: 0 },
      ]);

      const result = await service.getStreak('user-1');

      expect(result.currentStreak).toBe(0);
      expect(result.lastCheckinDate).toBe(threeDaysAgo);
    });

    it('should count PARTIAL check-ins below threshold as successful', async () => {
      const dates = [{ date: today }];

      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue(dates);
      streaksQueryRepo.getDistinctDatesAsc.mockResolvedValue(dates);

      streaksQueryRepo.getLogsByDate.mockResolvedValue([
        {
          status: HabitLogStatus.PARTIAL,
          portionRatio: 0.3, // Below PARTIAL_SUCCESS_THRESHOLD (0.5)
        },
      ]);

      const result = await service.getStreak('user-1');

      expect(result.currentStreak).toBe(1);
    });

    it('should treat CONSUMED check-in as a failed day', async () => {
      const dates = [
        { date: today },
        { date: yesterday },
      ];

      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue(dates);
      streaksQueryRepo.getDistinctDatesAsc.mockResolvedValue([...dates].reverse());

      // Today: CONSUMED (fails), yesterday: AVOIDED (succeeds)
      streaksQueryRepo.getLogsByDate
        .mockResolvedValueOnce([
          { status: HabitLogStatus.CONSUMED, portionRatio: 1 },
        ])
        .mockResolvedValueOnce([
          { status: HabitLogStatus.AVOIDED, portionRatio: 0 },
        ]);

      streaksQueryRepo.findUser.mockResolvedValue({
        ...mockUser,
        streakShieldsRemaining: 0,
      });

      const result = await service.getStreak('user-1');

      // The first day (today) is CONSUMED with no shield, so streak breaks immediately
      expect(result.currentStreak).toBe(0);
    });
  });

  describe('shield activation', () => {
    it('should use shield when day is failed and shields are available', async () => {
      const dates = [
        { date: today },
        { date: yesterday },
      ];

      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue(dates);
      streaksQueryRepo.getDistinctDatesAsc.mockResolvedValue([...dates].reverse());

      // Today: CONSUMED (fails but shield saves it), yesterday: AVOIDED
      streaksQueryRepo.getLogsByDate
        .mockResolvedValueOnce([
          { status: HabitLogStatus.CONSUMED, portionRatio: 1 },
        ])
        .mockResolvedValueOnce([
          { status: HabitLogStatus.AVOIDED, portionRatio: 0 },
        ])
        // Best streak calculation calls
        .mockResolvedValueOnce([
          { status: HabitLogStatus.AVOIDED, portionRatio: 0 },
        ])
        .mockResolvedValueOnce([
          { status: HabitLogStatus.CONSUMED, portionRatio: 1 },
        ]);

      const result = await service.getStreak('user-1');

      expect(result.currentStreak).toBe(2);
      expect(result.isShieldActive).toBe(true);
    });

    it('should not activate shield when no shields remaining', async () => {
      streaksQueryRepo.findUser.mockResolvedValue({
        ...mockUser,
        streakShieldsRemaining: 0,
      });

      const dates = [
        { date: today },
        { date: yesterday },
      ];

      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue(dates);
      streaksQueryRepo.getDistinctDatesAsc.mockResolvedValue([...dates].reverse());

      // Today: CONSUMED (no shield available)
      streaksQueryRepo.getLogsByDate
        .mockResolvedValueOnce([
          { status: HabitLogStatus.CONSUMED, portionRatio: 1 },
        ]);

      const result = await service.getStreak('user-1');

      // Streak should break because no shields
      expect(result.currentStreak).toBe(0);
      expect(result.isShieldActive).toBe(false);
    });
  });

  describe('shield replenishment', () => {
    it('should replenish shield on Monday if not already replenished today', async () => {
      // Mock Date to be a Monday
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-05T10:00:00Z')); // Monday

      const userWithOldReplenish = {
        ...mockUser,
        streakShieldsRemaining: 0,
        lastShieldReplenishDate: new Date('2025-12-29'), // Last Monday
      };
      streaksQueryRepo.findUser.mockResolvedValue(userWithOldReplenish);

      // Set up query for the getStreak call (returns empty dates)
      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue([]);

      await service.getStreak('user-1');

      // Shield should have been replenished
      expect(streaksCommandRepo.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({
          streakShieldsRemaining: STREAK_SHIELDS_PER_WEEK,
        }),
      );

      jest.useRealTimers();
    });

    it('should not replenish shield on non-Monday days', async () => {
      // Mock Date to be a Wednesday
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-07T10:00:00Z')); // Wednesday

      const userWithNoShields = {
        ...mockUser,
        streakShieldsRemaining: 0,
        lastShieldReplenishDate: new Date('2025-12-29'),
      };
      streaksQueryRepo.findUser.mockResolvedValue(userWithNoShields);

      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue([]);

      await service.getStreak('user-1');

      // save should NOT have been called for replenishment since it's Wednesday
      expect(streaksCommandRepo.saveUser).not.toHaveBeenCalledWith(
        expect.objectContaining({
          streakShieldsRemaining: STREAK_SHIELDS_PER_WEEK,
        }),
      );

      jest.useRealTimers();
    });

    it('should not replenish shield if already replenished today', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-05T10:00:00Z')); // Monday

      const userAlreadyReplenished = {
        ...mockUser,
        streakShieldsRemaining: STREAK_SHIELDS_PER_WEEK,
        lastShieldReplenishDate: new Date('2026-01-05'), // Already done today
      };
      streaksQueryRepo.findUser.mockResolvedValue(userAlreadyReplenished);

      streaksQueryRepo.getDistinctDatesDesc.mockResolvedValue([]);

      await service.getStreak('user-1');

      expect(streaksCommandRepo.saveUser).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
