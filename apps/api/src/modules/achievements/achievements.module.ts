import { Module } from '@nestjs/common';
import { AchievementsService } from './services/achievements.service';
import { AchievementsController } from './controllers/achievements.controller';
import { StatsModule } from '../stats/stats.module';
import { StreaksModule } from '../streaks/streaks.module';
import { FriendsModule } from '../friends/friends.module';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [StatsModule, StreaksModule, FriendsModule, ChallengesModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
