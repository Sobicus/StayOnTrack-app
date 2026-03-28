import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GamificationService } from './services/gamification.service';
import { QuestType } from './entities/quest.entity';
import { HabitLogStatus } from '../habit-logs/entities/habit-log.entity';
import { XP_REWARDS } from '@stayontrack/contracts';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { GamificationQueryRepository } from './repositories/gamification.query.repository';
import { GamificationCommandRepository } from './repositories/gamification.command.repository';

describe('GamificationService', () => {
  let service: GamificationService;
  let queryRepo: any;
  let commandRepo: any;
  let analyticsService: any;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    totalXp: 0,
  };

  const today = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    queryRepo = {
      findUserById: jest.fn().mockResolvedValue({ ...mockUser }),
      findQuestsByUserAndDate: jest.fn().mockResolvedValue([]),
      findQuestByUserTypeAndDate: jest.fn().mockResolvedValue(null),
      countActiveHabitsByUser: jest.fn().mockResolvedValue(0),
      countHabitLogsByUserAndDate: jest.fn().mockResolvedValue(0),
      countHabitLogsByUserDateAndStatus: jest.fn().mockResolvedValue(0),
      findEarliestHabitLogByUserAndDate: jest.fn().mockResolvedValue(null),
    };

    commandRepo = {
      createQuest: jest.fn().mockImplementation((data) => Promise.resolve({
        id: `quest-${Date.now()}-${Math.random()}`,
        ...data,
        createdAt: new Date(),
      })),
      saveQuest: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      saveUser: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    };

    analyticsService = {
      trackEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: GamificationQueryRepository, useValue: queryRepo },
        { provide: GamificationCommandRepository, useValue: commandRepo },
        { provide: AnalyticsService, useValue: analyticsService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  // ── getLevelInfo ─────────────────────────────────────────────────

  describe('getLevelInfo', () => {
    it('should return level 1 for 0 XP', async () => {
      queryRepo.findUserById.mockResolvedValue({ ...mockUser, totalXp: 0 });

      const result = await service.getLevelInfo('user-1');

      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(0);
      expect(result.nextLevelXp).toBe(100);
      expect(result.progress).toBe(0);
    });

    it('should return level 2 for 100 XP', async () => {
      queryRepo.findUserById.mockResolvedValue({ ...mockUser, totalXp: 100 });

      const result = await service.getLevelInfo('user-1');

      expect(result.level).toBe(2);
      expect(result.currentXp).toBe(100);
    });

    it('should return correct progress within a level', async () => {
      queryRepo.findUserById.mockResolvedValue({ ...mockUser, totalXp: 50 });

      const result = await service.getLevelInfo('user-1');

      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(50);
      expect(result.progress).toBe(0.5); // 50/100
    });

    it('should throw NotFoundException when user not found', async () => {
      queryRepo.findUserById.mockResolvedValue(null);

      await expect(service.getLevelInfo('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── addXp ───────────────────────────────────────────────────────

  describe('addXp', () => {
    it('should increment user XP by the given amount', async () => {
      const user = { ...mockUser, totalXp: 50 };
      queryRepo.findUserById.mockResolvedValue(user);

      const result = await service.addXp('user-1', 30);

      expect(result.totalXp).toBe(80);
      expect(result.xpEarned).toBe(30);
      expect(commandRepo.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ totalXp: 80 }),
      );
    });

    it('should detect level-up when XP crosses threshold', async () => {
      // User at 90 XP (level 1), adding 20 should cross 100 (level 2)
      const user = { ...mockUser, totalXp: 90 };
      queryRepo.findUserById.mockResolvedValue(user);

      const result = await service.addXp('user-1', 20);

      expect(result.totalXp).toBe(110);
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('should not detect level-up when XP stays within same level', async () => {
      const user = { ...mockUser, totalXp: 10 };
      queryRepo.findUserById.mockResolvedValue(user);

      const result = await service.addXp('user-1', 20);

      expect(result.totalXp).toBe(30);
      expect(result.levelUp).toBe(false);
      expect(result.newLevel).toBe(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      queryRepo.findUserById.mockResolvedValue(null);

      await expect(service.addXp('nonexistent', 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getDailyQuests ──────────────────────────────────────────────

  describe('getDailyQuests', () => {
    it('should generate 3 quests when none exist for today', async () => {
      queryRepo.findQuestsByUserAndDate.mockResolvedValue([]); // No existing quests

      const result = await service.getDailyQuests('user-1', today);

      expect(commandRepo.createQuest).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should return existing quests without regenerating', async () => {
      const existingQuests = [
        { id: 'q-1', questType: QuestType.LOG_ALL_HABITS, date: today, completed: false, completedAt: null, xpReward: 50, createdAt: new Date() },
        { id: 'q-2', questType: QuestType.AVOID_FULLY_ONE, date: today, completed: false, completedAt: null, xpReward: 50, createdAt: new Date() },
        { id: 'q-3', questType: QuestType.LOG_3_HABITS, date: today, completed: false, completedAt: null, xpReward: 50, createdAt: new Date() },
      ];
      queryRepo.findQuestsByUserAndDate.mockResolvedValue(existingQuests);

      const result = await service.getDailyQuests('user-1', today);

      expect(commandRepo.createQuest).not.toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should return quests with title and description from definitions', async () => {
      const existingQuests = [
        { id: 'q-1', questType: QuestType.LOG_ALL_HABITS, date: today, completed: false, completedAt: null, xpReward: 50, createdAt: new Date() },
      ];
      queryRepo.findQuestsByUserAndDate.mockResolvedValue(existingQuests);

      const result = await service.getDailyQuests('user-1', today);

      expect(result[0].title).toBe('Log all your habits today');
      expect(result[0].description).toBeDefined();
      expect(result[0].xpReward).toBe(50);
    });

    it('should set xpReward to QUEST_COMPLETE value for generated quests', async () => {
      queryRepo.findQuestsByUserAndDate.mockResolvedValue([]); // No existing quests

      await service.getDailyQuests('user-1', today);

      expect(commandRepo.createQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          xpReward: XP_REWARDS.QUEST_COMPLETE,
        }),
      );
    });
  });

  // ── checkAllQuests ──────────────────────────────────────────────

  describe('checkAllQuests', () => {
    it('should mark completed quests and award XP', async () => {
      const uncompleted = [
        { id: 'q-1', questType: QuestType.AVOID_FULLY_ONE, date: today, completed: false, completedAt: null, xpReward: 50, userId: 'user-1' },
      ];
      // First find call returns uncompleted quests, second returns updated quests
      queryRepo.findQuestsByUserAndDate
        .mockResolvedValueOnce(uncompleted) // initial find
        .mockResolvedValueOnce([ // re-fetch after update
          { ...uncompleted[0], completed: true, completedAt: new Date() },
        ]);

      // evaluateQuest: checkAvoidFullyOne returns true
      queryRepo.countHabitLogsByUserDateAndStatus.mockResolvedValue(1); // 1 AVOIDED log

      // addXp needs a user
      queryRepo.findUserById.mockResolvedValue({ ...mockUser, totalXp: 0 });

      const result = await service.checkAllQuests('user-1', today);

      expect(result.xpEarned).toBe(50);
      expect(result.completedNow).toContain(QuestType.AVOID_FULLY_ONE);
    });

    it('should skip already completed quests', async () => {
      const quests = [
        { id: 'q-1', questType: QuestType.LOG_ALL_HABITS, date: today, completed: true, completedAt: new Date(), xpReward: 50, userId: 'user-1' },
      ];
      queryRepo.findQuestsByUserAndDate
        .mockResolvedValueOnce(quests)
        .mockResolvedValueOnce(quests);

      const result = await service.checkAllQuests('user-1', today);

      expect(result.xpEarned).toBe(0);
      expect(result.completedNow).toHaveLength(0);
    });

    it('should not award XP for quests that are not yet met', async () => {
      const uncompleted = [
        { id: 'q-1', questType: QuestType.LOG_3_HABITS, date: today, completed: false, completedAt: null, xpReward: 50, userId: 'user-1' },
      ];
      queryRepo.findQuestsByUserAndDate
        .mockResolvedValueOnce(uncompleted)
        .mockResolvedValueOnce(uncompleted);

      // Only 1 log, need 3
      queryRepo.countHabitLogsByUserAndDate.mockResolvedValue(1);

      const result = await service.checkAllQuests('user-1', today);

      expect(result.xpEarned).toBe(0);
      expect(result.completedNow).toHaveLength(0);
    });

    it('should generate quests if none exist when checking', async () => {
      // First find returns empty, triggers generation, then the generated quests
      queryRepo.findQuestsByUserAndDate
        .mockResolvedValueOnce([]) // no quests yet
        .mockResolvedValueOnce([]); // re-fetch also empty (freshly generated but not completed)

      const result = await service.checkAllQuests('user-1', today);

      expect(commandRepo.createQuest).toHaveBeenCalledTimes(3);
      expect(result.quests).toHaveLength(0); // re-fetch returned empty
    });
  });
});
