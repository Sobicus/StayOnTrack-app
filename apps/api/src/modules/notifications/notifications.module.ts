import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { Habit } from '../habits/entities/habit.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, HabitLog, Habit]),
    StreaksModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
