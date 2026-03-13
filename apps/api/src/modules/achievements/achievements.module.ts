import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { StatsModule } from '../stats/stats.module';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [StatsModule, StreaksModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
