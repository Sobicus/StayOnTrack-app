import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './entities/habit.entity';
import { HabitTemplate } from './entities/habit-template.entity';
import { HabitsService } from './services/habits.service';
import { HabitsController } from './controllers/habits.controller';
import { HabitsQueryRepository } from './repositories/habits.query.repository';
import { HabitsCommandRepository } from './repositories/habits.command.repository';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, HabitTemplate]), AnalyticsModule],
  controllers: [HabitsController],
  providers: [HabitsService, HabitsQueryRepository, HabitsCommandRepository],
  exports: [HabitsService],
})
export class HabitsModule {}
