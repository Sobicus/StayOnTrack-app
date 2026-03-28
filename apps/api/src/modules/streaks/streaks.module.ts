import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { User } from '../users/entities/user.entity';
import { StreaksService } from './services/streaks.service';
import { StreaksController } from './controllers/streaks.controller';
import { StreaksQueryRepository } from './repositories/streaks.query.repository';
import { StreaksCommandRepository } from './repositories/streaks.command.repository';
import { HabitsModule } from '../habits/habits.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HabitLog, User]),
    HabitsModule,
    GamificationModule,
  ],
  controllers: [StreaksController],
  providers: [StreaksService, StreaksQueryRepository, StreaksCommandRepository],
  exports: [StreaksService],
})
export class StreaksModule {}
