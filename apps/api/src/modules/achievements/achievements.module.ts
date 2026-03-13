import { Module, forwardRef } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
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
