import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn(
        'RESEND_API_KEY not set — emails will be logged to console only',
      );
    }
  }

  private get fromAddress(): string {
    return (
      this.configService.get<string>('EMAIL_FROM') ||
      'StayOnTrack <noreply@stayontrack.app>'
    );
  }

  private get appUrl(): string {
    return (
      this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:4801'
    );
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

    if (this.resend) {
      try {
        await this.resend.emails.send({
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
