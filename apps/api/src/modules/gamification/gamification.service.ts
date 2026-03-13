import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Quest, QuestType } from './entities/quest.entity';
import { HabitLog, HabitLogStatus } from '../habit-logs/entities/habit-log.entity';
import { Habit } from '../habits/entities/habit.entity';
import { QUEST_DEFINITIONS, getQuestDefinitionMap } from './quest-definitions';
import { getLevel, getXpForNextLevel, XP_REWARDS } from '@stayontrack/contracts';

export interface LevelInfo {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
}

export interface AddXpResult {
  totalXp: number;
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
}

export interface QuestResponse {
  id: string;
  questType: QuestType;
  title: string;
  description: string;
  completed: boolean;
  completedAt: Date | null;
  xpReward: number;
}

export interface CheckQuestsResult {
  quests: QuestResponse[];
  xpEarned: number;
  completedNow: string[];
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Quest)
    private readonly questRepository: Repository<Quest>,
    @InjectRepository(HabitLog)
    private readonly habitLogRepository: Repository<HabitLog>,
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
  ) {}

  /**
   * Get level info for a user.
   */
  async getLevelInfo(userId: string): Promise<LevelInfo> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return getXpForNextLevel(user.totalXp);
  }

  /**
   * Add XP to a user. Returns the result including whether a level-up occurred.
   */
  async addXp(userId: string, amount: number): Promise<AddXpResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousLevel = getLevel(user.totalXp);

    user.totalXp += amount;
    await this.userRepository.save(user);

    const newLevel = getLevel(user.totalXp);

    return {
      totalXp: user.totalXp,
      xpEarned: amount,
      levelUp: newLevel > previousLevel,
      newLevel,
    };
  }

  // ── Daily Quests ──────────────────────────────────────────────────

  /**
   * Get today's quests for a user. Generates them if they don't exist yet.
   */
  async getDailyQuests(userId: string, today?: string): Promise<QuestResponse[]> {
    const date = today || this.getTodayDate();

    let quests = await this.questRepository.find({
      where: { userId, date },
      order: { createdAt: 'ASC' },
    });

    if (quests.length === 0) {
      quests = await this.generateDailyQuests(userId, date);
    }

    return this.mapQuestsToResponse(quests);
  }

  /**
   * Check all uncompleted quests for today and award XP for newly completed ones.
   */
  async checkAllQuests(userId: string, today?: string): Promise<CheckQuestsResult> {
    const date = today || this.getTodayDate();

    // Ensure quests exist
    let quests = await this.questRepository.find({
      where: { userId, date },
    });

    if (quests.length === 0) {
      quests = await this.generateDailyQuests(userId, date);
    }

    let totalXpEarned = 0;
    const completedNow: string[] = [];

    for (const quest of quests) {
      if (quest.completed) continue;

      const isCompleted = await this.evaluateQuest(userId, quest.questType, date);
      if (isCompleted) {
        quest.completed = true;
        quest.completedAt = new Date();
        await this.questRepository.save(quest);

        await this.addXp(userId, quest.xpReward);
        totalXpEarned += quest.xpReward;
        completedNow.push(quest.questType);
      }
    }

    // Re-fetch to get updated state
    const updatedQuests = await this.questRepository.find({
      where: { userId, date },
      order: { createdAt: 'ASC' },
    });

    return {
      quests: this.mapQuestsToResponse(updatedQuests),
      xpEarned: totalXpEarned,
      completedNow,
    };
  }

  /**
   * Check a single quest type for completion.
   */
  async checkQuestCompletion(
    userId: string,
    questType: QuestType,
    today?: string,
  ): Promise<boolean> {
    const date = today || this.getTodayDate();

    const quest = await this.questRepository.findOne({
      where: { userId, questType, date },
    });

    if (!quest || quest.completed) {
      return quest?.completed ?? false;
    }

    const isCompleted = await this.evaluateQuest(userId, questType, date);
    if (isCompleted) {
      quest.completed = true;
      quest.completedAt = new Date();
      await this.questRepository.save(quest);

      await this.addXp(userId, quest.xpReward);
    }

    return isCompleted;
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Generate 3 random quests for the given date.
   */
  private async generateDailyQuests(userId: string, date: string): Promise<Quest[]> {
    // Shuffle and pick 3
    const shuffled = [...QUEST_DEFINITIONS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);

    const quests: Quest[] = [];
    for (const def of picked) {
      const quest = this.questRepository.create({
        userId,
        questType: def.type,
        date,
        completed: false,
        xpReward: XP_REWARDS.QUEST_COMPLETE,
      });
      const saved = await this.questRepository.save(quest);
      quests.push(saved);
    }

    return quests;
  }

  /**
   * Evaluate whether a quest condition is met.
   */
  private async evaluateQuest(
    userId: string,
    questType: QuestType,
    date: string,
  ): Promise<boolean> {
    switch (questType) {
      case QuestType.LOG_ALL_HABITS:
        return this.checkLogAllHabits(userId, date);

      case QuestType.AVOID_FULLY_ONE:
        return this.checkAvoidFullyOne(userId, date);

      case QuestType.CHECK_IN_BEFORE_NOON:
        return this.checkCheckInBeforeNoon(userId, date);

      case QuestType.LOG_3_HABITS:
        return this.checkLog3Habits(userId, date);

      default:
        return false;
    }
  }

  /**
   * log_all_habits: User has logged every active habit for today.
   */
  private async checkLogAllHabits(userId: string, date: string): Promise<boolean> {
    const activeHabits = await this.habitRepository.count({
      where: { userId, isActive: true },
    });

    if (activeHabits === 0) return false;

    const logsToday = await this.habitLogRepository.count({
      where: { userId, date },
    });

    return logsToday >= activeHabits;
  }

  /**
   * avoid_fully_one: At least one log today with status AVOIDED (portionRatio = 0).
   */
  private async checkAvoidFullyOne(userId: string, date: string): Promise<boolean> {
    const count = await this.habitLogRepository.count({
      where: { userId, date, status: HabitLogStatus.AVOIDED },
    });

    return count >= 1;
  }

  /**
   * check_in_before_noon: At least one log created before 12:00 PM today.
   */
  private async checkCheckInBeforeNoon(userId: string, date: string): Promise<boolean> {
    const logs = await this.habitLogRepository.find({
      where: { userId, date },
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (logs.length === 0) return false;

    const createdAt = logs[0].createdAt;
    return createdAt.getHours() < 12;
  }

  /**
   * log_3_habits: At least 3 habit logs for today.
   */
  private async checkLog3Habits(userId: string, date: string): Promise<boolean> {
    const count = await this.habitLogRepository.count({
      where: { userId, date },
    });

    return count >= 3;
  }

  /**
   * Map Quest entities to response DTOs with title/description from definitions.
   */
  private mapQuestsToResponse(quests: Quest[]): QuestResponse[] {
    const defMap = getQuestDefinitionMap();

    return quests.map((quest) => {
      const def = defMap.get(quest.questType);
      return {
        id: quest.id,
        questType: quest.questType,
        title: def?.title ?? quest.questType,
        description: def?.description ?? '',
        completed: quest.completed,
        completedAt: quest.completedAt,
        xpReward: quest.xpReward,
      };
    });
  }

  /**
   * Get today's date as YYYY-MM-DD string.
   */
  private getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}
