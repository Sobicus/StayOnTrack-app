import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../common/email/email.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ProfileVisibility } from '../users/entities/user.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// uuid mock no longer needed — forgotPassword now uses JWT

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let emailService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    username: 'testuser',
    avatarUrl: null,
    weightKg: null,
    heightCm: null,
    goal: null,
    visibility: ProfileVisibility.PRIVATE,
    locale: 'en',
    streakShieldsRemaining: 1,
    dayEndHour: 0,
    currency: 'EUR',
    weekStartDay: 'monday',
    onboardingCompleted: false,
    refreshTokenHash: 'hashed-refresh-token',
    passwordResetTokenHash: null,
    passwordResetExpires: null,
    lastShieldReplenishDate: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      findWithActiveResetToken: jest.fn().mockResolvedValue([]),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
    };

    emailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-refresh-secret'),
          },
        },
        { provide: EmailService, useValue: emailService },
        { provide: AnalyticsService, useValue: { trackEvent: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create a user with hashed password and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'password123', username: 'testuser' };

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        username: 'testuser',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should lowercase and trim the email', async () => {
      const dto = { email: '  Test@Example.COM  ', password: 'password123', username: 'testuser' };

      await service.register(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('should throw on duplicate email', async () => {
      usersService.create.mockRejectedValue(new ConflictException('Email is already registered'));

      const dto = { email: 'test@example.com', password: 'password123', username: 'testuser' };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should store hashed refresh token and send verification email', async () => {
      const dto = { email: 'test@example.com', password: 'password123', username: 'testuser' };

      await service.register(dto);

      // Should update with verification code
      expect(usersService.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ emailVerificationCode: expect.any(String) }),
      );
      // Should update with refresh token hash
      expect(usersService.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ refreshTokenHash: 'hashed-password' }),
      );
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto = { email: 'test@example.com', password: 'password123' };
      const result = await service.login(dto);

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('refreshToken', 'mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw on invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = { email: 'test@example.com', password: 'wrongpassword' };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on non-existent user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const dto = { email: 'nonexistent@example.com', password: 'password123' };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should lowercase and trim the email on login', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto = { email: '  Test@Example.COM  ', password: 'password123' };
      await service.login(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refresh('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-refresh-secret',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw on invalid / expired refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user not found for token subject', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user has no stored refresh token hash', async () => {
      usersService.findById.mockResolvedValue({ ...mockUser, refreshTokenHash: null });

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if stored hash does not match the token', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('revoked-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should clear the refresh token hash', async () => {
      await service.revokeRefreshToken('user-1');

      expect(usersService.update).toHaveBeenCalledWith('user-1', {
        refreshTokenHash: null,
      });
    });
  });

  describe('forgotPassword', () => {
    it('should generate a JWT reset token and send email', async () => {
      await service.forgotPassword('test@example.com');

      // Should sign a JWT with userId and purpose
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', purpose: 'password-reset' }),
        expect.objectContaining({ expiresIn: '1h' }),
      );
      expect(usersService.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          passwordResetTokenHash: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('should silently succeed for non-existent email (prevent enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('unknown@example.com')).resolves.toBeUndefined();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password when JWT token is valid', async () => {
      // jwtService.verify returns { userId, purpose }
      jwtService.verify.mockReturnValue({ userId: 'user-1', purpose: 'password-reset' });
      const userWithResetToken = {
        ...mockUser,
        passwordResetTokenHash: 'valid-jwt-token',
        passwordResetExpires: new Date(Date.now() + 3600000),
      };
      usersService.findById.mockResolvedValue(userWithResetToken);

      await service.resetPassword('valid-jwt-token', 'newpassword123');

      expect(usersService.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          passwordHash: 'hashed-password',
          passwordResetTokenHash: null,
          passwordResetExpires: null,
        }),
      );
    });

    it('should throw if JWT verification fails', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('invalid token'); });

      await expect(
        service.resetPassword('invalid-token', 'newpassword123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user not found for token userId', async () => {
      jwtService.verify.mockReturnValue({ userId: 'nonexistent', purpose: 'password-reset' });
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.resetPassword('valid-jwt', 'newpassword123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
