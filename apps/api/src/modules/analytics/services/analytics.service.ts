import { Injectable, Logger } from '@nestjs/common';
import {
  AnalyticsQueryRepository,
  RetentionCohort,
  EventCount,
  UserFunnel,
} from '../repositories/analytics.query.repository';
import { AnalyticsCommandRepository } from '../repositories/analytics.command.repository';

export { RetentionCohort, EventCount, UserFunnel };

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly queryRepo: AnalyticsQueryRepository,
    private readonly commandRepo: AnalyticsCommandRepository,
  ) {}

  /**
   * Fire-and-forget event tracking. Never throws.
   */
  async trackEvent(
    userId: string | null,
    eventType: string,
    eventData?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.commandRepo.createEvent(userId, eventType, eventData ?? null);
    } catch (error) {
      this.logger.warn(`Failed to track event "${eventType}": ${error}`);
    }
  }

  /**
   * Calculate day-1, day-7, day-30 retention cohorts.
   */
  async getRetentionCohorts(
    startDate: Date,
    endDate: Date,
  ): Promise<RetentionCohort[]> {
    return this.queryRepo.getRetentionCohorts(startDate, endDate);
  }

  /**
   * Count distinct users with checkin_completed events on a given date.
   */
  async getDailyActiveUsers(date: Date): Promise<number> {
    return this.queryRepo.getDailyActiveUsers(date);
  }

  /**
   * Get daily event counts for a given event type over N days.
   */
  async getEventCounts(
    eventType: string,
    days: number,
  ): Promise<EventCount[]> {
    return this.queryRepo.getEventCounts(eventType, days);
  }

  /**
   * Conversion funnel: registered -> created habit -> first checkin -> active on day 7.
   */
  async getUserFunnel(): Promise<UserFunnel> {
    return this.queryRepo.getUserFunnel();
  }
}
