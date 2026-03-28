import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Quest } from './entities/quest.entity';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { Habit } from '../habits/entities/habit.entity';
import { GamificationService } from './services/gamification.service';
import { GamificationController } from './controllers/gamification.controller';
import { GamificationQueryRepository } from './repositories/gamification.query.repository';
import { GamificationCommandRepository } from './repositories/gamification.command.repository';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Quest, HabitLog, Habit]), AnalyticsModule],
  controllers: [GamificationController],
  providers: [GamificationService, GamificationQueryRepository, GamificationCommandRepository],
  exports: [GamificationService],
})
export class GamificationModule {}
