import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { User } from '../users/entities/user.entity';
import { StreaksService } from './streaks.service';
import { StreaksController } from './streaks.controller';
import { HabitsModule } from '../habits/habits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HabitLog, User]),
    HabitsModule,
  ],
  controllers: [StreaksController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
