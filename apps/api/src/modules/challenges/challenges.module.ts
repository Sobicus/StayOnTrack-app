import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { UsersModule } from '../users/users.module';
import { FriendsModule } from '../friends/friends.module';
import { StatsModule } from '../stats/stats.module';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeParticipant]),
    UsersModule,
    FriendsModule,
    StatsModule,
    StreaksModule,
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
