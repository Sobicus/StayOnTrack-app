import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitLog } from './entities/habit-log.entity';
import { HabitLogsService } from './habit-logs.service';
import { HabitLogsController } from './habit-logs.controller';
import { HabitsModule } from '../habits/habits.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HabitLog]),
    HabitsModule,
    GamificationModule,
    AnalyticsModule,
  ],
  controllers: [HabitLogsController],
  providers: [HabitLogsService],
  exports: [HabitLogsService],
})
export class HabitLogsModule {}
