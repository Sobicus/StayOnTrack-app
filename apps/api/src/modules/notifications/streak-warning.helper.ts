import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { EmailService } from '../../common/email/email.service';

const logger = new Logger('StreakWarningHelper');

export interface UserAtStreakRisk {
  email: string;
  username: string;
  currentStreak: number;
}

/**
 * Get the current hour (0-23) in the given IANA timezone.
 */
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    // Invalid timezone — fall back to UTC
    return new Date().getUTCHours();
  }
}

/**
 * Get today's date string (YYYY-MM-DD) in the given IANA timezone.
 */
function getTodayForTimezone(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Find users whose streaks are at risk of being broken today.
 *
 * Criteria:
 * - emailReminders = true
 * - Has a streak > 3 (meaningful enough to warn about)
 * - No habit logs today (haven't checked in yet)
 * - Current hour in user's timezone >= their reminderHour
 *
 * The streak is approximated by counting consecutive days with logs
 * ending yesterday. This avoids importing the full StreaksService
 * (which has complex dependencies) and keeps this helper standalone.
 */
export async function findUsersAtStreakRisk(
  userRepo: Repository<User>,
  habitLogRepo: Repository<HabitLog>,
): Promise<UserAtStreakRisk[]> {
  // Step 1: Find all users with email reminders enabled
  const users = await userRepo.find({
    where: { emailReminders: true },
  });

  const atRisk: UserAtStreakRisk[] = [];

  for (const user of users) {
    const timezone = user.timezone || 'UTC';
    const currentHour = getCurrentHourInTimezone(timezone);

    // Only send if it's past the user's reminder hour
    if (currentHour < user.reminderHour) {
      continue;
    }

    const today = getTodayForTimezone(timezone);

    // Check if the user has any habit logs today
    const todayLogCount = await habitLogRepo.count({
      where: { userId: user.id, date: today },
    });

    if (todayLogCount > 0) {
      // Already checked in today — no warning needed
      continue;
    }

    // Calculate approximate current streak by counting consecutive days
    // with logs ending yesterday
    const streak = await calculateApproxStreak(habitLogRepo, user.id, today);

    if (streak > 3) {
      atRisk.push({
        email: user.email,
        username: user.username,
        currentStreak: streak,
      });
    }
  }

  return atRisk;
}

/**
 * Calculate an approximate streak by counting consecutive days with logs
 * going backwards from yesterday.
 */
async function calculateApproxStreak(
  habitLogRepo: Repository<HabitLog>,
  userId: string,
  today: string,
): Promise<number> {
  // Get distinct dates with logs, ordered descending
  const rows = await habitLogRepo
    .createQueryBuilder('log')
    .select('DISTINCT log.date', 'date')
    .where('log.userId = :userId', { userId })
    .andWhere('log.date < :today', { today })
    .orderBy('log.date', 'DESC')
    .limit(400) // Safety limit
    .getRawMany();

  if (rows.length === 0) return 0;

  // The most recent log date should be yesterday for a live streak
  const yesterday = getDateOffset(today, -1);
  if (rows[0].date !== yesterday) {
    return 0; // Last check-in wasn't yesterday — streak already broken
  }

  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const expected = getDateOffset(yesterday, -i);
    if (rows[i].date === expected) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getDateOffset(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00Z'); // noon UTC to avoid DST edge cases
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Send streak warning emails to all at-risk users.
 *
 * Designed to be called from NotificationsService (TASK-318)
 * or from a cron job.
 *
 * @returns Summary with the count of emails sent.
 */
export async function sendStreakWarnings(
  users: UserAtStreakRisk[],
  emailService: EmailService,
): Promise<{ sent: number }> {
  let sent = 0;

  for (const user of users) {
    try {
      await emailService.sendStreakWarning(
        user.email,
        user.username,
        user.currentStreak,
      );
      sent++;
    } catch (error) {
      logger.error(
        `Failed to send streak warning to ${user.email}: ${error}`,
      );
    }
  }

  logger.log(`Streak warnings sent: ${sent}/${users.length}`);
  return { sent };
}
