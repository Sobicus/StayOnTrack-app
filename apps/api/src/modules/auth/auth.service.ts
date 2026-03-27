import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { EmailService } from '../../common/email/email.service';
import { AnalyticsService } from '../analytics/analytics.service';

const BCRYPT_SALT_ROUNDS = 10;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string = '30d';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
  ) {
    this.refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret-change-in-production',
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      username: dto.username,
    });

    this.analyticsService
      .trackEvent(user.id, 'user_registered')
      .catch(() => {});

    // Generate 6-digit verification code and send email
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(verificationCode, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(user.id, {
      emailVerificationCode: hashedCode,
      emailVerificationSentAt: new Date(),
    });

    // Send verification email (don't block registration if it fails)
    this.emailService.sendVerificationEmail(user.email, user.username, verificationCode).catch(() => {});

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(
      dto.email.toLowerCase().trim(),
      dto.password,
    );

    return this.issueTokens(user);
  }

  /**
   * Refresh: validate the refresh token, issue new access + refresh pair.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify stored hash matches
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    return this.issueTokens(user);
  }

  /**
   * Logout: clear the stored refresh token hash so it can't be reused.
   */
  async revokeRefreshToken(userId: string): Promise<void> {
    await this.usersService.update(userId, { refreshTokenHash: null });
  }

  /**
   * Verify email with 6-digit code.
   */
  async verifyEmail(userId: string, code: string): Promise<{ verified: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) return { verified: true };
    if (!user.emailVerificationCode) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    const isValid = await bcrypt.compare(code, user.emailVerificationCode);
    if (!isValid) throw new BadRequestException('Invalid verification code');

    await this.usersService.update(user.id, {
      emailVerified: true,
      emailVerificationCode: null,
    });

    return { verified: true };
  }

  /**
   * Resend email verification code with 60-second cooldown.
   */
  async resendVerification(userId: string): Promise<{ sent: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    // 60-second cooldown
    if (user.emailVerificationSentAt) {
      const elapsed = Date.now() - new Date(user.emailVerificationSentAt).getTime();
      if (elapsed < 60000) {
        const remaining = Math.ceil((60000 - elapsed) / 1000);
        throw new BadRequestException(`Please wait ${remaining} seconds before requesting a new code`);
      }
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(verificationCode, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(user.id, {
      emailVerificationCode: hashedCode,
      emailVerificationSentAt: new Date(),
    });

    await this.emailService.sendVerificationEmail(user.email, user.username, verificationCode);
    return { sent: true };
  }

  /**
   * Forgot password: generate a JWT reset token, store expiry, send email.
   * Uses JWT so resetPassword() can do O(1) lookup by userId.
   * Always returns success to prevent email enumeration.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    // Use JWT as reset token — encodes userId for O(1) lookup in resetPassword()
    const resetToken = this.jwtService.sign(
      { userId: user.id, purpose: 'password-reset' },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '1h' },
    );

    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.update(user.id, {
      passwordResetTokenHash: resetToken, // Store the JWT directly (no bcrypt needed — it's signed)
      passwordResetExpires: expires,
    });

    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }

  /**
   * Reset password: decode JWT to get userId (O(1)), validate, update password.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: { userId: string; purpose: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findById(payload.userId);
    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify that the stored token matches (prevents reuse after a new token is generated)
    if (user.passwordResetTokenHash !== token) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check expiry
    if (new Date() > new Date(user.passwordResetExpires)) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password and clear reset fields
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(user.id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    });
  }

  async googleLogin(googleProfile: {
    googleId: string;
    email: string;
    displayName: string;
    avatar?: string;
  }): Promise<AuthResponse> {
    const { googleId, email, displayName, avatar } = googleProfile;

    if (!email) {
      throw new BadRequestException('Google account must have an email');
    }

    // Check if user exists by googleId
    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      // Check if user exists by email
      user = await this.usersService.findByEmail(email);

      if (user) {
        // Link Google to existing account
        await this.usersService.update(user.id, {
          googleId,
          emailVerified: true,
          avatarUrl: user.avatarUrl || avatar || null,
        });
        user = await this.usersService.findById(user.id);
      } else {
        // Create new user
        const username = await this.generateUniqueUsername(displayName);
        user = await this.usersService.create({
          email,
          passwordHash: await bcrypt.hash(
            crypto.randomBytes(32).toString('hex'),
            BCRYPT_SALT_ROUNDS,
          ),
          username,
          avatarUrl: avatar || null,
          googleId,
          emailVerified: true,
        });
      }
    }

    if (!user) {
      throw new BadRequestException('Failed to create or find user');
    }

    return this.issueTokens(user);
  }

  private async generateUniqueUsername(displayName: string): Promise<string> {
    let base =
      displayName.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
    let username = base;
    let counter = 1;

    while (await this.usersService.findByUsername(username)) {
      username = `${base}${counter}`;
      counter++;
    }

    return username;
  }

  async telegramAuth(initData: string): Promise<AuthResponse> {
    // Validate Telegram initData hash
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Sort params and create check string
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken || !hash) {
      throw new BadRequestException('Telegram auth not configured');
    }

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const checkHash = crypto.createHmac('sha256', secretKey).update(sortedParams).digest('hex');

    if (checkHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram auth data');
    }

    // Extract user data
    const userData = JSON.parse(params.get('user') || '{}');
    if (!userData.id) {
      throw new BadRequestException('No user data in Telegram initData');
    }

    const chatId = userData.id.toString();
    const user = await this.usersService.findByTelegramChatId(chatId);

    if (!user) {
      throw new BadRequestException('Telegram account not linked. Please link via the app first.');
    }

    return this.issueTokens(user);
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  /**
   * Issue a new access + refresh token pair and store refresh hash on user.
   */
  private async issueTokens(user: User): Promise<AuthResponse> {
    const payload = { sub: user.id, email: user.email };

    // Access token (short-lived, uses JwtModule default secret + 15m)
    const accessToken = this.jwtService.sign(payload);

    // Refresh token (long-lived, separate secret)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });

    // Store hashed refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(user.id, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user: UserResponseDto.fromEntity(user),
    };
  }
}
