import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface WeeklyDigestStats {
  totalCheckins: number;
  caloriesSaved: number;
  moneySaved: number;
  currentStreak: number;
  weeklyXpEarned: number;
  topHabit: string;
  completionRate: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (gmailUser && gmailAppPassword) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });
      this.logger.log(`Gmail SMTP initialized for ${gmailUser}`);
    } else {
      this.logger.warn(
        'GMAIL_USER/GMAIL_APP_PASSWORD not set — emails will be logged to console only',
      );
    }
  }

  private get fromAddress(): string {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    return (
      this.configService.get<string>('EMAIL_FROM') ||
      `StayOnTrack <${gmailUser || 'noreply@stayontrack.app'}>`
    );
  }

  private get appUrl(): string {
    return (
      this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:4801'
    );
  }

  /**
   * Send an email verification code.
   */
  async sendVerificationEmail(
    email: string,
    username: string,
    code: string,
  ): Promise<void> {
    const subject = 'Verify your StayOnTrack email';
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #3b82f6;">Welcome to StayOnTrack, ${username}!</h2>
        <p>Your verification code is:</p>
        <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f8fafc;">${code}</span>
        </div>
        <p style="color: #94a3b8;">Enter this code in the app to verify your email. The code is valid until you request a new one.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject,
          html,
        });
        this.logger.log(`Verification email sent to ${email}`);
        return;
      } catch (error) {
        this.logger.error(`Failed to send verification email to ${email}`, error);
        // Fall through to console logging
      }
    }

    // Dev fallback: log to console
    this.logger.log(`\n========== EMAIL VERIFICATION ==========`);
    this.logger.log(`Email: ${email}`);
    this.logger.log(`Username: ${username}`);
    this.logger.log(`Code: ${code}`);
    this.logger.log(`=========================================\n`);
  }

  /**
   * Send a password reset email.
   * If Resend is configured → sends real email.
   * Otherwise → logs to console (dev mode).
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.appUrl}/auth/reset-password?token=${resetToken}`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject: 'Reset your StayOnTrack password',
          html: this.passwordResetTemplate(resetUrl),
        });
        this.logger.log(`Password reset email sent to ${email}`);
        return;
      } catch (error) {
        this.logger.error(`Failed to send email to ${email}`, error);
        // Fall through to console logging
      }
    }

    // Dev fallback: log to console
    this.logger.log(`\n========== PASSWORD RESET ==========`);
    this.logger.log(`Email: ${email}`);
    this.logger.log(`Reset URL: ${resetUrl}`);
    this.logger.log(`Token: ${resetToken}`);
    this.logger.log(`====================================\n`);
  }

  /**
   * Send a daily check-in reminder email.
   * If Resend is configured → sends real email.
   * Otherwise → logs to console (dev mode).
   */
  async sendDailyReminder(
    email: string,
    username: string,
    currentStreak: number,
  ): Promise<void> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject: "Don't break your streak! \uD83D\uDD25",
          html: this.dailyReminderTemplate(username, currentStreak),
        });
        this.logger.log(`Daily reminder email sent to ${email}`);
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send daily reminder to ${email}`,
          error,
        );
        // Fall through to console logging
      }
    }

    // Dev fallback: log to console
    this.logger.log(`\n========== DAILY REMINDER ==========`);
    this.logger.log(`Email: ${email}`);
    this.logger.log(`Username: ${username}`);
    this.logger.log(`Current streak: ${currentStreak}`);
    this.logger.log(`=====================================\n`);
  }

  /**
   * Send a streak warning email — urgent but supportive reminder
   * that the user's significant streak is at risk of being lost.
   * Different from dailyReminder: targets users with streak > 3
   * and uses a more prominent streak display.
   */
  async sendStreakWarning(
    email: string,
    username: string,
    currentStreak: number,
  ): Promise<void> {
    const checkinUrl = `${this.appUrl}/dashboard`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject: `Your ${currentStreak}-day streak is at risk! ⚠️`,
          html: this.streakWarningTemplate(username, currentStreak, checkinUrl),
        });
        this.logger.log(`Streak warning email sent to ${email}`);
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send streak warning email to ${email}`,
          error,
        );
        // Fall through to console logging
      }
    }

    // Dev fallback: log to console
    this.logger.log(`\n========== STREAK WARNING ==========`);
    this.logger.log(`Email: ${email}`);
    this.logger.log(`Username: ${username}`);
    this.logger.log(`Current streak: ${currentStreak} days`);
    this.logger.log(`Check-in URL: ${checkinUrl}`);
    this.logger.log(`====================================\n`);
  }

  /**
   * Send a weekly digest email with progress stats.
   * If Resend is configured → sends real email.
   * Otherwise → logs to console (dev mode).
   */
  async sendWeeklyDigest(
    email: string,
    username: string,
    stats: WeeklyDigestStats,
  ): Promise<void> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject: 'Your weekly progress report 📊',
          html: this.weeklyDigestTemplate(username, stats),
        });
        this.logger.log(`Weekly digest email sent to ${email}`);
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send weekly digest to ${email}`,
          error,
        );
        // Fall through to console logging
      }
    }

    // Dev fallback: log to console
    this.logger.log(`\n========== WEEKLY DIGEST ==========`);
    this.logger.log(`Email: ${email}`);
    this.logger.log(`Username: ${username}`);
    this.logger.log(`Check-ins: ${stats.totalCheckins}`);
    this.logger.log(`Calories saved: ${stats.caloriesSaved}`);
    this.logger.log(`Money saved: ${stats.moneySaved}`);
    this.logger.log(`Streak: ${stats.currentStreak}`);
    this.logger.log(`XP earned: ${stats.weeklyXpEarned}`);
    this.logger.log(`Top habit: ${stats.topHabit}`);
    this.logger.log(`Completion rate: ${stats.completionRate}%`);
    this.logger.log(`====================================\n`);
  }

  private weeklyDigestTemplate(
    username: string,
    stats: WeeklyDigestStats,
  ): string {
    const dashboardUrl = `${this.appUrl}/dashboard`;
    const completionPct = Math.round(stats.completionRate);
    const caloriesDisplay = Math.round(stats.caloriesSaved).toLocaleString();
    const moneyDisplay = stats.moneySaved.toFixed(2);

    const encouragement =
      completionPct >= 80
        ? 'Outstanding week! You\'re crushing it! 🏆'
        : completionPct >= 50
          ? 'Great progress this week! Keep building momentum! 💪'
          : completionPct > 0
            ? 'Every step counts — you showed up and that matters! 🌱'
            : 'A fresh week is ahead — let\'s make it count! ✨';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6366F1; font-size: 24px; margin: 0;">📊 StayOnTrack</h1>
          <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Your Weekly Progress Report</p>
        </div>

        <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px; text-align: center;">
          Hey ${username}, here's your week in review!
        </h2>

        <p style="color: #6366F1; font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 24px;">
          ${encouragement}
        </p>

        <!-- Stats cards -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
          <!-- Check-ins -->
          <div style="flex: 1 1 45%; background: #F0FDF4; border-radius: 12px; padding: 16px; text-align: center; min-width: 140px;">
            <div style="font-size: 28px; font-weight: 800; color: #16A34A;">${stats.totalCheckins}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Check-ins</div>
          </div>

          <!-- Completion rate -->
          <div style="flex: 1 1 45%; background: #EEF2FF; border-radius: 12px; padding: 16px; text-align: center; min-width: 140px;">
            <div style="font-size: 28px; font-weight: 800; color: #6366F1;">${completionPct}%</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Completion Rate</div>
          </div>

          <!-- Calories saved -->
          <div style="flex: 1 1 45%; background: #FEF3C7; border-radius: 12px; padding: 16px; text-align: center; min-width: 140px;">
            <div style="font-size: 28px; font-weight: 800; color: #D97706;">${caloriesDisplay}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Calories Saved</div>
          </div>

          <!-- Money saved -->
          <div style="flex: 1 1 45%; background: #ECFDF5; border-radius: 12px; padding: 16px; text-align: center; min-width: 140px;">
            <div style="font-size: 28px; font-weight: 800; color: #059669;">$${moneyDisplay}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Money Saved</div>
          </div>
        </div>

        <!-- Streak & XP row -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <!-- Current streak -->
          <div style="flex: 1; background: linear-gradient(135deg, #FEF3C7, #FDE68A); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 800; color: #92400E;">🔥 ${stats.currentStreak}</div>
            <div style="font-size: 12px; color: #92400E; margin-top: 4px;">Day Streak</div>
          </div>

          <!-- Weekly XP -->
          <div style="flex: 1; background: linear-gradient(135deg, #EDE9FE, #DDD6FE); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 800; color: #5B21B6;">+${stats.weeklyXpEarned}</div>
            <div style="font-size: 12px; color: #5B21B6; margin-top: 4px;">XP Earned</div>
          </div>
        </div>

        ${stats.topHabit ? `
        <!-- Top habit -->
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">⭐ Top Habit This Week</div>
          <div style="font-size: 18px; font-weight: 700; color: #111827;">${stats.topHabit}</div>
        </div>
        ` : ''}

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${dashboardUrl}"
             style="display: inline-block; background: #6366F1; color: white; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
            View Full Stats
          </a>
        </div>

        <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; text-align: center;">
          Remember — partial progress always counts. Every step matters.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
          StayOnTrack — Track what you avoided
        </p>
        <p style="color: #D1D5DB; font-size: 10px; text-align: center; margin-top: 8px;">
          You're receiving this because you have email reminders enabled.
          You can turn them off in your profile settings.
        </p>
      </div>
    `;
  }

  private streakWarningTemplate(
    username: string,
    currentStreak: number,
    checkinUrl: string,
  ): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6366F1; font-size: 24px; margin: 0;">🔥 StayOnTrack</h1>
        </div>
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; font-size: 48px; font-weight: 800; padding: 16px 32px; border-radius: 16px; line-height: 1;">
            ${currentStreak}
          </span>
          <p style="color: #6B7280; font-size: 14px; margin-top: 8px;">day streak</p>
        </div>
        <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px; text-align: center;">
          Don't let your streak slip!
        </h2>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
          Hey ${username}! You've built an amazing <strong>${currentStreak}-day streak</strong>.
          That's real progress and something to be proud of.
        </p>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          A quick check-in is all it takes to keep your momentum going.
          It only takes a few seconds!
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${checkinUrl}"
             style="display: inline-block; background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
            Save Your Streak
          </a>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; text-align: center;">
          Remember — even partial progress counts. Every step matters.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
          StayOnTrack — Track what you avoided
        </p>
        <p style="color: #D1D5DB; font-size: 10px; text-align: center; margin-top: 8px;">
          You're receiving this because you have email reminders enabled.
          You can turn them off in your profile settings.
        </p>
      </div>
    `;
  }

  private dailyReminderTemplate(
    username: string,
    currentStreak: number,
  ): string {
    const checkinUrl = `${this.appUrl}/dashboard`;
    const streakMessage =
      currentStreak > 0
        ? `You're on a <strong>${currentStreak}-day streak</strong>! Don't let it slip away.`
        : `Start a new streak today — every day counts!`;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6366F1; font-size: 24px; margin: 0;">\uD83D\uDD25 StayOnTrack</h1>
        </div>
        <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">Hey ${username}, time to check in!</h2>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
          You haven't logged your habits today yet.
        </p>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          ${streakMessage}
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${checkinUrl}"
             style="display: inline-block; background: #6366F1; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Check In Now
          </a>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5;">
          You're receiving this because you enabled daily reminders.
          You can turn them off in your profile settings.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
          StayOnTrack — Track what you avoided
        </p>
      </div>
    `;
  }

  private passwordResetTemplate(resetUrl: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6366F1; font-size: 24px; margin: 0;">🔥 StayOnTrack</h1>
        </div>
        <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset. Click the button below to set a new password.
          This link expires in 1 hour.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #6366F1; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email.
          Your password will not be changed.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
          StayOnTrack — Track what you avoided
        </p>
      </div>
    `;
  }
}
