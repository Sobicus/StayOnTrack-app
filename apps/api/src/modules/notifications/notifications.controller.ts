import { Controller, Post, UseGuards, HttpCode } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * POST /notifications/send-daily-reminders
   * Trigger daily reminder emails for all qualifying users.
   * Protected by JWT — intended for admin/cron usage.
   */
  @Post('send-daily-reminders')
  @HttpCode(200)
  async sendDailyReminders() {
    return this.notificationsService.sendDailyReminders();
  }

  /**
   * POST /notifications/send-weekly-digest
   * Trigger weekly digest emails for all users with reminders enabled.
   * Protected by JWT — intended for admin/cron usage.
   */
  @Post('send-weekly-digest')
  @HttpCode(200)
  async sendWeeklyDigest() {
    return this.notificationsService.sendWeeklyDigests();
  }
}
