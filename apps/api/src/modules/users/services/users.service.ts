import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersQueryRepository } from '../repositories/users.query.repository';
import { UsersCommandRepository } from '../repositories/users.command.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly queryRepo: UsersQueryRepository,
    private readonly commandRepo: UsersCommandRepository,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.queryRepo.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.queryRepo.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.queryRepo.findByUsername(username);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.queryRepo.findByGoogleId(googleId);
  }

  async findByTelegramChatId(chatId: string): Promise<User | null> {
    return this.queryRepo.findByTelegramChatId(chatId);
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

    const user = this.commandRepo.create(data);
    return this.commandRepo.save(user);
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
    return this.commandRepo.save(user);
  }

  /**
   * Find users with active (non-expired) password reset tokens.
   */
  async findWithActiveResetToken(): Promise<User[]> {
    return this.queryRepo.findWithActiveResetToken();
  }

  /**
   * Award bonus streak shield(s) to a user. No limit.
   */
  async addShields(userId: string, count: number = 1): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    user.streakShieldsRemaining += count;
    await this.commandRepo.save(user);
  }

  async findByTelegramLinkCode(code: string): Promise<User | null> {
    const user = await this.queryRepo.findByTelegramLinkCode(code);
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

    return this.queryRepo.exportUserData(userId);
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
    await this.commandRepo.remove(user);
  }
}
