import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitLog } from './entities/habit-log.entity';
import { HabitLogsService } from './services/habit-logs.service';
import { HabitLogsController } from './controllers/habit-logs.controller';
import { HabitLogsQueryRepository } from './repositories/habit-logs.query.repository';
import { HabitLogsCommandRepository } from './repositories/habit-logs.command.repository';
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
  providers: [HabitLogsService, HabitLogsQueryRepository, HabitLogsCommandRepository],
  exports: [HabitLogsService],
})
export class HabitLogsModule {}
