import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { User } from '../users/entities/user.entity';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { Habit } from '../habits/entities/habit.entity';
import { EmailService, WeeklyDigestStats } from '../../common/email/email.service';
import { StreaksService } from '../streaks/streaks.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private pushEnabled = false;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(HabitLog)
    private readonly habitLogRepo: Repository<HabitLog>,
    @InjectRepository(Habit)
    private readonly habitRepo: Repository<Habit>,
    private readonly emailService: EmailService,
    private readonly streaksService: StreaksService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  onModuleInit() {
    const vapidPublic = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivate = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidEmail = this.configService.get<string>('VAPID_EMAIL', 'mailto:noreply@stayontrack.app');
    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(vapidEmail!, vapidPublic, vapidPrivate);
      this.pushEnabled = true;
      this.logger.log('Web Push (VAPID) configured');
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled');
    }
  }

  async subscribePush(userId: string, subscription: any): Promise<void> {
    await this.usersService.update(userId, { pushSubscription: subscription });
  }

  async unsubscribePush(userId: string): Promise<void> {
    await this.usersService.update(userId, { pushSubscription: null });
  }

  async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    if (!this.pushEnabled) return;

    const user = await this.usersService.findById(userId);
    if (!user?.pushSubscription) return;

    try {
      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify({ title, body, icon: '/icons/icon-192x192.png' }),
      );
    } catch (err: any) {
      if (err.statusCode === 410) {
        // Subscription expired, clean up
        await this.usersService.update(userId, { pushSubscription: null });
      }
    }
  }

  /**
   * Find users who:
   * 1. Have emailReminders enabled
   * 2. Current hour in their timezone matches their reminderHour
   * 3. Have NO habit logs for today (in their timezone)
   */
  async getUsersNeedingReminder(): Promise<User[]> {
    // Get all users with reminders enabled
    const users = await this.userRepo.find({
      where: { emailReminders: true },
    });

    const now = new Date();
    const usersNeedingReminder: User[] = [];

    for (const user of users) {
      // Determine current hour in the user's timezone
      let userHour: number;
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: user.timezone || 'UTC',
          hour: 'numeric',
          hour12: false,
        });
        userHour = parseInt(formatter.format(now), 10);
      } catch {
        // If timezone is invalid, fall back to UTC
        userHour = now.getUTCHours();
      }

      // Check if current hour matches the user's reminder hour
      if (userHour !== user.reminderHour) {
        continue;
      }

      // Get today's date in the user's timezone
      let todayStr: string;
      try {
        const dateFormatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: user.timezone || 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        todayStr = dateFormatter.format(now); // YYYY-MM-DD format
      } catch {
        todayStr = now.toISOString().slice(0, 10);
      }

      // Check if user has any habit logs for today
      const logCount = await this.habitLogRepo.count({
        where: {
          userId: user.id,
          date: todayStr,
        },
      });

      if (logCount === 0) {
        usersNeedingReminder.push(user);
      }
    }

    return usersNeedingReminder;
  }

  /**
   * Send daily reminder emails to all qualifying users.
   * Returns the number of emails sent.
   */
  async sendDailyReminders(): Promise<{ sent: number }> {
    const users = await this.getUsersNeedingReminder();
    this.logger.log(
      `Found ${users.length} user(s) needing daily reminder`,
    );

    let sent = 0;

    for (const user of users) {
      try {
        // Get current streak for the user
        const streakResult = await this.streaksService.getStreak(user.id);
        const currentStreak = streakResult.currentStreak;

        await this.emailService.sendDailyReminder(
          user.email,
          user.username,
          currentStreak,
        );

        // Also send push notification if user has a subscription
        await this.sendPushNotification(
          user.id,
          'Daily Reminder',
          `Don't forget to check in today! Current streak: ${currentStreak} day(s).`,
        ).catch(() => {});

        sent++;
      } catch (error) {
        this.logger.error(
          `Failed to send daily reminder to user ${user.id}`,
          error,
        );
      }
    }

    this.logger.log(`Sent ${sent} daily reminder email(s)`);
    return { sent };
  }

  /**
   * Send weekly digest emails to all users with emailReminders enabled.
   * Computes last-7-day stats from habit logs.
   * Returns the number of emails sent.
   */
  async sendWeeklyDigests(): Promise<{ sent: number }> {
    const users = await this.userRepo.find({
      where: { emailReminders: true },
    });

    this.logger.log(
      `Found ${users.length} user(s) eligible for weekly digest`,
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10);

    let sent = 0;

    for (const user of users) {
      try {
        const stats = await this.computeWeeklyStats(user, startDate);
        await this.emailService.sendWeeklyDigest(
          user.email,
          user.username,
          stats,
        );
        sent++;
      } catch (error) {
        this.logger.error(
          `Failed to send weekly digest to user ${user.id}`,
          error,
        );
      }
    }

    this.logger.log(`Sent ${sent} weekly digest email(s)`);
    return { sent };
  }

  /**
   * Compute weekly stats for a single user from their habit logs
   * over the last 7 days (from startDate onwards).
   */
  private async computeWeeklyStats(
    user: User,
    startDate: string,
  ): Promise<WeeklyDigestStats> {
    // Get all habit logs for the user in the last 7 days
    const logs = await this.habitLogRepo.find({
      where: {
        userId: user.id,
        date: MoreThanOrEqual(startDate),
      },
    });

    // Total check-ins
    const totalCheckins = logs.length;

    // Sum saved calories and money
    const caloriesSaved = logs.reduce(
      (sum, log) => sum + (log.savedCalories || 0),
      0,
    );
    const moneySaved = logs.reduce(
      (sum, log) => sum + (log.savedMoney || 0),
      0,
    );

    // Current streak
    let currentStreak = 0;
    try {
      const streakResult = await this.streaksService.getStreak(user.id);
      currentStreak = streakResult.currentStreak;
    } catch {
      // If streak service fails, default to 0
    }

    // Weekly XP: approximate from totalXp (we don't track XP history per-day,
    // so we estimate based on check-in count — each check-in typically awards XP)
    // Simple heuristic: count logs * base XP per check-in (10 XP each)
    const weeklyXpEarned = totalCheckins * 10;

    // Top habit: the habit with the most check-ins this week
    let topHabit = '';
    if (logs.length > 0) {
      const habitCounts = new Map<string, number>();
      for (const log of logs) {
        habitCounts.set(
          log.habitId,
          (habitCounts.get(log.habitId) || 0) + 1,
        );
      }
      // Find the habitId with the most logs
      let maxCount = 0;
      let topHabitId = '';
      for (const [habitId, count] of habitCounts) {
        if (count > maxCount) {
          maxCount = count;
          topHabitId = habitId;
        }
      }
      // Look up the habit title
      if (topHabitId) {
        const habit = await this.habitRepo.findOne({
          where: { id: topHabitId },
        });
        topHabit = habit ? habit.title : '';
      }
    }

    // Completion rate: active habits vs check-ins over 7 days
    const activeHabits = await this.habitRepo.count({
      where: { userId: user.id, isActive: true },
    });
    const possibleCheckins = activeHabits * 7;
    const completionRate =
      possibleCheckins > 0
        ? Math.min(100, (totalCheckins / possibleCheckins) * 100)
        : 0;

    return {
      totalCheckins,
      caloriesSaved,
      moneySaved,
      currentStreak,
      weeklyXpEarned,
      topHabit,
      completionRate,
    };
  }
}
