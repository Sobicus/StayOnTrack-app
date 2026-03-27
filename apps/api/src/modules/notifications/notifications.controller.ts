import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

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

  /**
   * POST /notifications/subscribe
   * Subscribe to push notifications (Web Push API).
   */
  @Post('subscribe')
  @HttpCode(200)
  async subscribePush(
    @CurrentUser() user: User,
    @Body() body: { subscription: any },
  ) {
    await this.notificationsService.subscribePush(user.id, body.subscription);
    return { subscribed: true };
  }

  /**
   * POST /notifications/unsubscribe
   * Unsubscribe from push notifications.
   */
  @Post('unsubscribe')
  @HttpCode(204)
  async unsubscribePush(@CurrentUser() user: User) {
    await this.notificationsService.unsubscribePush(user.id);
  }
}
