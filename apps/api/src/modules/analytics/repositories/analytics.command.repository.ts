import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

@Injectable()
export class AnalyticsCommandRepository {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly repo: Repository<AnalyticsEvent>,
  ) {}

  async createEvent(
    userId: string | null,
    eventType: string,
    eventData: Record<string, unknown> | null,
  ): Promise<void> {
    const event = this.repo.create({
      userId,
      eventType,
      eventData,
    });
    await this.repo.save(event);
  }
}
