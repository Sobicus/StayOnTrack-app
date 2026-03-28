import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './services/notifications.service';
import { EmailService } from '../../common/email/email.service';
import { StreaksService } from '../streaks/streaks.service';
import { UsersService } from '../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsQueryRepository } from './repositories/notifications.query.repository';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let queryRepo: any;
  let emailService: any;
  let streaksService: any;

  // Use UTC timezone and match the current UTC hour so the reminder filter passes
  const currentUtcHour = new Date().getUTCHours();

  const mockUserWithReminders = {
    id: 'user-1',
    email: 'alice@example.com',
    username: 'alice',
    emailReminders: true,
    reminderHour: currentUtcHour,
    timezone: 'UTC',
    totalXp: 100,
  };

  const mockUserWithoutReminders = {
    id: 'user-2',
    email: 'bob@example.com',
    username: 'bob',
    emailReminders: false,
    reminderHour: 20,
    timezone: 'UTC',
    totalXp: 50,
  };

  beforeEach(async () => {
    queryRepo = {
      findUsersWithRemindersEnabled: jest.fn().mockResolvedValue([]),
      countHabitLogsByUserAndDate: jest.fn().mockResolvedValue(0),
      findHabitLogsByUserSinceDate: jest.fn().mockResolvedValue([]),
      findHabitById: jest.fn().mockResolvedValue(null),
      countActiveHabitsByUser: jest.fn().mockResolvedValue(0),
    };

    emailService = {
      sendDailyReminder: jest.fn().mockResolvedValue(undefined),
      sendWeeklyDigest: jest.fn().mockResolvedValue(undefined),
    };

    streaksService = {
      getStreak: jest.fn().mockResolvedValue({
        currentStreak: 5,
        bestStreak: 10,
        streakShieldsRemaining: 1,
        lastCheckinDate: null,
        isShieldActive: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsQueryRepository, useValue: queryRepo },
        { provide: EmailService, useValue: emailService },
        { provide: StreaksService, useValue: streaksService },
        { provide: UsersService, useValue: { findById: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue(undefined) } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  // ── getUsersNeedingReminder ─────────────────────────────────────

  describe('getUsersNeedingReminder', () => {
    it('should return users who have reminders enabled, matching hour, and no logs today', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([mockUserWithReminders]);
      queryRepo.countHabitLogsByUserAndDate.mockResolvedValue(0); // No logs today

      const result = await service.getUsersNeedingReminder();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
    });

    it('should exclude users who already have logs today', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([mockUserWithReminders]);
      queryRepo.countHabitLogsByUserAndDate.mockResolvedValue(3); // Has logs today

      const result = await service.getUsersNeedingReminder();

      expect(result).toHaveLength(0);
    });

    it('should exclude users whose reminder hour does not match current hour', async () => {
      // Set reminder hour to something different from current UTC hour
      const differentHour = (currentUtcHour + 6) % 24;
      const userWithDifferentHour = {
        ...mockUserWithReminders,
        reminderHour: differentHour,
      };
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([userWithDifferentHour]);

      const result = await service.getUsersNeedingReminder();

      expect(result).toHaveLength(0);
    });

    it('should return empty array when no users have reminders enabled', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([]); // query already filters emailReminders=true

      const result = await service.getUsersNeedingReminder();

      expect(result).toHaveLength(0);
    });

    it('should handle invalid timezone gracefully', async () => {
      const userWithBadTz = {
        ...mockUserWithReminders,
        timezone: 'Invalid/Timezone',
      };
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([userWithBadTz]);
      queryRepo.countHabitLogsByUserAndDate.mockResolvedValue(0);

      // Should not throw — falls back to UTC
      const result = await service.getUsersNeedingReminder();

      // Result depends on whether UTC hour matches reminderHour
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── sendDailyReminders ──────────────────────────────────────────

  describe('sendDailyReminders', () => {
    it('should send daily reminders to qualifying users', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([mockUserWithReminders]);
      queryRepo.countHabitLogsByUserAndDate.mockResolvedValue(0); // No logs today

      const result = await service.sendDailyReminders();

      expect(emailService.sendDailyReminder).toHaveBeenCalledWith(
        'alice@example.com',
        'alice',
        5, // currentStreak from mock
      );
      expect(result.sent).toBe(1);
    });

    it('should return sent: 0 when no users need reminders', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([]);

      const result = await service.sendDailyReminders();

      expect(result.sent).toBe(0);
      expect(emailService.sendDailyReminder).not.toHaveBeenCalled();
    });

    it('should continue sending to other users if one fails', async () => {
      const user2 = {
        ...mockUserWithReminders,
        id: 'user-2',
        email: 'carol@example.com',
        username: 'carol',
      };
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([mockUserWithReminders, user2]);
      queryRepo.countHabitLogsByUserAndDate.mockResolvedValue(0); // No logs for either

      emailService.sendDailyReminder
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(undefined);

      const result = await service.sendDailyReminders();

      expect(emailService.sendDailyReminder).toHaveBeenCalledTimes(2);
      expect(result.sent).toBe(1); // Only second succeeded
    });

    it('should fetch current streak for each user', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([mockUserWithReminders]);
      queryRepo.countHabitLogsByUserAndDate.mockResolvedValue(0);

      await service.sendDailyReminders();

      expect(streaksService.getStreak).toHaveBeenCalledWith('user-1');
    });
  });

  // ── sendWeeklyDigests ───────────────────────────────────────────

  describe('sendWeeklyDigests', () => {
    it('should send weekly digest to users with reminders enabled', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([mockUserWithReminders]);
      queryRepo.findHabitLogsByUserSinceDate.mockResolvedValue([]); // No logs in range

      const result = await service.sendWeeklyDigests();

      expect(emailService.sendWeeklyDigest).toHaveBeenCalledWith(
        'alice@example.com',
        'alice',
        expect.objectContaining({
          totalCheckins: expect.any(Number),
          caloriesSaved: expect.any(Number),
          moneySaved: expect.any(Number),
          currentStreak: expect.any(Number),
        }),
      );
      expect(result.sent).toBe(1);
    });

    it('should compute stats from habit logs in the last 7 days', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([mockUserWithReminders]);
      queryRepo.findHabitLogsByUserSinceDate.mockResolvedValue([
        { habitId: 'h1', savedCalories: 200, savedMoney: 5 },
        { habitId: 'h1', savedCalories: 300, savedMoney: 8 },
        { habitId: 'h2', savedCalories: 100, savedMoney: 3 },
      ]);
      queryRepo.findHabitById.mockResolvedValue({ id: 'h1', title: 'No Sweets' });
      queryRepo.countActiveHabitsByUser.mockResolvedValue(2);

      const result = await service.sendWeeklyDigests();

      expect(emailService.sendWeeklyDigest).toHaveBeenCalledWith(
        'alice@example.com',
        'alice',
        expect.objectContaining({
          totalCheckins: 3,
          caloriesSaved: 600,
          moneySaved: 16,
          topHabit: 'No Sweets',
        }),
      );
      expect(result.sent).toBe(1);
    });

    it('should return sent: 0 when no users eligible', async () => {
      queryRepo.findUsersWithRemindersEnabled.mockResolvedValue([]);

      const result = await service.sendWeeklyDigests();

      expect(result.sent).toBe(0);
    });
  });
});
