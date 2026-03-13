import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
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
   * Forgot password: generate a reset token, store hash, send email.
   * Always returns success to prevent email enumeration.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    const resetToken = uuidv4();
    const resetTokenHash = await bcrypt.hash(resetToken, BCRYPT_SALT_ROUNDS);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.update(user.id, {
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpires: expires,
    });

    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }

  /**
   * Reset password: validate token, update password, clear reset fields.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user with non-expired reset token
    // We need to check all users with reset tokens — not ideal but works for MVP
    // A better approach would be encoding the user ID in the token
    const users = await this.usersService.findWithActiveResetToken();

    let matchedUser: User | null = null;
    for (const user of users) {
      if (!user.passwordResetTokenHash) continue;
      const isValid = await bcrypt.compare(token, user.passwordResetTokenHash);
      if (isValid) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password and clear reset fields
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(matchedUser.id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    });
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
