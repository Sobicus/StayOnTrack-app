import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, IsNull, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
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

  async create(data: {
    email: string;
    passwordHash: string;
    username: string;
    avatarUrl?: string | null;
    googleId?: string | null;
    emailVerified?: boolean;
  }): Promise<User> {
    // Check email uniqueness
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Check username uniqueness
    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If updating username, check uniqueness
    if (data.username && data.username !== user.username) {
      const existingUsername = await this.findByUsername(data.username);
      if (existingUsername) {
        throw new ConflictException('Username is already taken');
      }
    }

    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  /**
   * Find users with active (non-expired) password reset tokens.
   */
  async findWithActiveResetToken(): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        passwordResetTokenHash: Not(IsNull()),
        passwordResetExpires: MoreThan(new Date()),
      },
    });
  }

  /**
   * Award bonus streak shield(s) to a user. No limit.
   */
  async addShields(userId: string, count: number = 1): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    user.streakShieldsRemaining += count;
    await this.usersRepository.save(user);
  }

  async findByTelegramLinkCode(code: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { telegramLinkCode: code } });
    if (!user || !user.telegramLinkCodeExpiresAt) return null;
    if (new Date() > new Date(user.telegramLinkCodeExpiresAt)) return null;
    return user;
  }

  async generateTelegramLinkCode(userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.update(userId, {
      telegramLinkCode: code,
      telegramLinkCodeExpiresAt: expiresAt,
    });
    return code;
  }

  async unlinkTelegram(userId: string): Promise<void> {
    await this.update(userId, {
      telegramChatId: null,
      telegramLinked: false,
      telegramLinkCode: null,
      telegramLinkCodeExpiresAt: null,
    });
  }

  /**
   * GDPR: Export all user data as a JSON object.
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Query related data from all tables
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

  /**
   * Delete a user account and all related data (cascade).
   * GDPR: users must be able to delete their account.
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.remove(user);
  }
}
