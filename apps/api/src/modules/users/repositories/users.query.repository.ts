import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThan, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async findByTelegramChatId(chatId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramChatId: chatId } });
  }

  async findByTelegramLinkCode(code: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramLinkCode: code } });
  }

  async findWithActiveResetToken(): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        passwordResetTokenHash: Not(IsNull()),
        passwordResetExpires: MoreThan(new Date()),
      },
    });
  }

  /**
   * GDPR: Export all user data as a JSON object.
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.findById(userId);
    if (!user) {
      return {};
    }

    const [habits, habitLogs, friendships, challenges] = await Promise.all([
      this.dataSource.query(
        `SELECT id, title, emoji, category, "caloriesPerOccurrence", "pricePerOccurrence", "frequencyType", "createdAt" FROM habits WHERE "userId" = $1`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT hl.id, hl.date, hl.status, hl."portionRatio", hl."savedCalories", hl."savedMoney", h.title as "habitTitle" FROM habit_logs hl LEFT JOIN habits h ON hl."habitId" = h.id WHERE hl."userId" = $1 ORDER BY hl.date DESC`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT f.id, f."createdAt", u.username as "friendUsername" FROM friendships f LEFT JOIN users u ON (CASE WHEN f."userAId" = $1 THEN f."userBId" ELSE f."userAId" END) = u.id WHERE f."userAId" = $1 OR f."userBId" = $1`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT c.id, c.title, c.type, c.target, c.status, c."startDate", c."endDate", cp.progress, cp.status as "participantStatus" FROM challenge_participants cp JOIN challenges c ON cp."challengeId" = c.id WHERE cp."userId" = $1`,
        [userId],
      ),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        username: user.username,
        weightKg: user.weightKg,
        heightCm: user.heightCm,
        goal: user.goal,
        visibility: user.visibility,
        locale: user.locale,
        currency: user.currency,
        weekStartDay: user.weekStartDay,
        dayEndHour: user.dayEndHour,
        createdAt: user.createdAt,
      },
      habits,
      habitLogs,
      friendships,
      challenges,
    };
  }
}
