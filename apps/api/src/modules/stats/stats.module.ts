import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { Habit } from '../habits/entities/habit.entity';
import { StatsService } from './services/stats.service';
import { StatsController } from './controllers/stats.controller';
import { StatsQueryRepository } from './repositories/stats.query.repository';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HabitLog, Habit]),
    ActivitiesModule,
  ],
  controllers: [StatsController],
  providers: [StatsService, StatsQueryRepository],
  exports: [StatsService],
})
export class StatsModule {}
