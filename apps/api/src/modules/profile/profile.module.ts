import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersModule } from '../users/users.module';
import { StatsModule } from '../stats/stats.module';
import { StreaksModule } from '../streaks/streaks.module';
import { FriendsModule } from '../friends/friends.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [UsersModule, StatsModule, StreaksModule, FriendsModule, AchievementsModule, ChallengesModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
