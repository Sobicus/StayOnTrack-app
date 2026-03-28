import { Test, TestingModule } from '@nestjs/testing';
import { AchievementsService } from './services/achievements.service';
import { StatsService } from '../stats/stats.service';
import { StreaksService } from '../streaks/streaks.service';
import { FriendsService } from '../friends/services/friends.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ACHIEVEMENTS } from './achievements.constants';

describe('AchievementsService', () => {
  let service: AchievementsService;
  let statsService: any;
  let streaksService: any;
  let friendsService: any;
  let challengesService: any;

  const defaultStats = {
    totalSavedCalories: 0,
    totalSavedMoney: 0,
    potentialWeightAvoidedKg: 0,
    totalCheckIns: 0,
    totalDaysTracked: 0,
  };

  const defaultStreak = {
    currentStreak: 0,
    bestStreak: 0,
    streakShieldsRemaining: 1,
    lastCheckinDate: null,
    isShieldActive: false,
  };

  beforeEach(async () => {
    statsService = {
      getUserStats: jest.fn().mockResolvedValue({ ...defaultStats }),
    };

    streaksService = {
      getStreak: jest.fn().mockResolvedValue({ ...defaultStreak }),
    };

    friendsService = {
      getFriendCount: jest.fn().mockResolvedValue(0),
    };

    challengesService = {
      getChallengeCount: jest.fn().mockResolvedValue(0),
      getWinCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: StatsService, useValue: statsService },
        { provide: StreaksService, useValue: streaksService },
        { provide: FriendsService, useValue: friendsService },
        { provide: ChallengesService, useValue: challengesService },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
  });

  describe('getUserAchievements', () => {
    it('should return all achievements with progress', async () => {
      const result = await service.getUserAchievements('user-1');

      expect(result.total).toBe(ACHIEVEMENTS.length);
      expect(result.achievements).toHaveLength(ACHIEVEMENTS.length);
      expect(result.achievements[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          category: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          emoji: expect.any(String),
          threshold: expect.any(Number),
          unit: expect.any(String),
          progress: expect.any(Number),
          unlocked: expect.any(Boolean),
          progressPercent: expect.any(Number),
        }),
      );
    });

    it('should return zero unlocked when all stats are zero', async () => {
      const result = await service.getUserAchievements('user-1');

      expect(result.unlocked).toBe(0);
      expect(result.achievements.every((a) => !a.unlocked)).toBe(true);
    });

    it('should include recentlyUnlocked for achievements near threshold', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 1100, // Exceeds 1000 but within 1.2x (1200)
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      expect(cal1k?.unlocked).toBe(true);
      expect(result.recentlyUnlocked.some((a) => a.id === 'cal-1k')).toBe(true);
    });

    it('should not include in recentlyUnlocked if far past threshold', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 5000, // 5x the 1000 threshold => not recent
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      expect(cal1k?.unlocked).toBe(true);
      // 5000 >= 1000 * 1.2 = 1200, so NOT recently unlocked
      expect(result.recentlyUnlocked.some((a) => a.id === 'cal-1k')).toBe(false);
    });
  });

  describe('progress calculation - CALORIES category', () => {
    it('should use totalSavedCalories for CALORIES achievements', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 8000,
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      expect(cal1k?.progress).toBe(8000);
      expect(cal1k?.unlocked).toBe(true);

      const cal1kg = result.achievements.find((a) => a.id === 'cal-1kg');
      expect(cal1kg?.progress).toBe(8000);
      expect(cal1kg?.unlocked).toBe(true); // 8000 >= 7700
    });
  });

  describe('progress calculation - STREAK category', () => {
    it('should use max of currentStreak and bestStreak', async () => {
      streaksService.getStreak.mockResolvedValue({
        ...defaultStreak,
        currentStreak: 5,
        bestStreak: 10,
      });

      const result = await service.getUserAchievements('user-1');

      const streak7 = result.achievements.find((a) => a.id === 'streak-7');
      expect(streak7?.progress).toBe(10); // max(5, 10)
      expect(streak7?.unlocked).toBe(true);

      const streak14 = result.achievements.find((a) => a.id === 'streak-14');
      expect(streak14?.progress).toBe(10);
      expect(streak14?.unlocked).toBe(false);
    });

    it('should use currentStreak when it exceeds bestStreak', async () => {
      streaksService.getStreak.mockResolvedValue({
        ...defaultStreak,
        currentStreak: 15,
        bestStreak: 10,
      });

      const result = await service.getUserAchievements('user-1');

      const streak14 = result.achievements.find((a) => a.id === 'streak-14');
      expect(streak14?.progress).toBe(15); // max(15, 10)
      expect(streak14?.unlocked).toBe(true);
    });
  });

  describe('progress calculation - CHECKINS category', () => {
    it('should use totalCheckIns for CHECKINS achievements', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalCheckIns: 55,
      });

      const result = await service.getUserAchievements('user-1');

      const checkin1 = result.achievements.find((a) => a.id === 'checkin-1');
      expect(checkin1?.progress).toBe(55);
      expect(checkin1?.unlocked).toBe(true);

      const checkin50 = result.achievements.find((a) => a.id === 'checkin-50');
      expect(checkin50?.progress).toBe(55);
      expect(checkin50?.unlocked).toBe(true);

      const checkin100 = result.achievements.find((a) => a.id === 'checkin-100');
      expect(checkin100?.unlocked).toBe(false);
    });
  });

  describe('unlocked status', () => {
    it('should mark achievement as unlocked when progress >= threshold', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 1000,
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      expect(cal1k?.unlocked).toBe(true);
    });

    it('should NOT mark achievement as unlocked when progress < threshold', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 999,
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      expect(cal1k?.unlocked).toBe(false);
    });
  });

  describe('progressPercent calculation', () => {
    it('should calculate progressPercent as 0 when no progress', async () => {
      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      expect(cal1k?.progressPercent).toBe(0);
    });

    it('should calculate progressPercent correctly for partial progress', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 500,
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      // 500 / 1000 * 100 = 50%
      expect(cal1k?.progressPercent).toBe(50);
    });

    it('should cap progressPercent at 100', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 50000,
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      expect(cal1k?.progressPercent).toBe(100);
    });

    it('should round progressPercent to nearest integer', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedCalories: 333,
      });

      const result = await service.getUserAchievements('user-1');

      const cal1k = result.achievements.find((a) => a.id === 'cal-1k');
      // 333 / 1000 * 100 = 33.3 => rounded to 33
      expect(cal1k?.progressPercent).toBe(33);
    });
  });

  describe('MONEY category', () => {
    it('should use totalSavedMoney for MONEY achievements', async () => {
      statsService.getUserStats.mockResolvedValue({
        ...defaultStats,
        totalSavedMoney: 75,
      });

      const result = await service.getUserAchievements('user-1');

      const money10 = result.achievements.find((a) => a.id === 'money-10');
      expect(money10?.progress).toBe(75);
      expect(money10?.unlocked).toBe(true);

      const money50 = result.achievements.find((a) => a.id === 'money-50');
      expect(money50?.unlocked).toBe(true);

      const money100 = result.achievements.find((a) => a.id === 'money-100');
      expect(money100?.unlocked).toBe(false);
    });
  });

  describe('SOCIAL category', () => {
    it('should use friendCount for SOCIAL achievements', async () => {
      friendsService.getFriendCount.mockResolvedValue(5);

      const result = await service.getUserAchievements('user-1');

      const socialFirst = result.achievements.find((a) => a.id === 'social-first');
      expect(socialFirst?.progress).toBe(5);
      expect(socialFirst?.unlocked).toBe(true);

      const social5 = result.achievements.find((a) => a.id === 'social-5');
      expect(social5?.unlocked).toBe(true);
    });
  });

  describe('CHALLENGES category', () => {
    it('should use challengeCount for challenge participation', async () => {
      challengesService.getChallengeCount.mockResolvedValue(3);

      const result = await service.getUserAchievements('user-1');

      const challengeFirst = result.achievements.find((a) => a.id === 'challenge-first');
      expect(challengeFirst?.progress).toBe(3);
      expect(challengeFirst?.unlocked).toBe(true);
    });

    it('should use winCount for wins-based achievements', async () => {
      challengesService.getWinCount.mockResolvedValue(2);

      const result = await service.getUserAchievements('user-1');

      const challengeWin = result.achievements.find((a) => a.id === 'challenge-win');
      expect(challengeWin?.progress).toBe(2);
      expect(challengeWin?.unlocked).toBe(true);

      const challenge3wins = result.achievements.find((a) => a.id === 'challenge-3wins');
      expect(challenge3wins?.unlocked).toBe(false);
    });

    it('should handle weekend-challenges unit correctly', async () => {
      challengesService.getChallengeCount.mockResolvedValue(1);

      const result = await service.getUserAchievements('user-1');

      const weekendWarrior = result.achievements.find((a) => a.id === 'challenge-weekend');
      expect(weekendWarrior?.progress).toBe(1);
      expect(weekendWarrior?.unlocked).toBe(true);
    });

    it('should return 0 for weekend-challenges when no challenges', async () => {
      challengesService.getChallengeCount.mockResolvedValue(0);

      const result = await service.getUserAchievements('user-1');

      const weekendWarrior = result.achievements.find((a) => a.id === 'challenge-weekend');
      expect(weekendWarrior?.progress).toBe(0);
      expect(weekendWarrior?.unlocked).toBe(false);
    });
  });
});
