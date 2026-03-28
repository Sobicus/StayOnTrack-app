import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsQueryRepository } from './repositories/analytics.query.repository';
import { AnalyticsCommandRepository } from './repositories/analytics.command.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsQueryRepository, AnalyticsCommandRepository],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
