import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { ChallengesService } from './services/challenges.service';
import { ChallengesController } from './controllers/challenges.controller';
import { ChallengesQueryRepository } from './repositories/challenges.query.repository';
import { ChallengesCommandRepository } from './repositories/challenges.command.repository';
import { UsersModule } from '../users/users.module';
import { FriendsModule } from '../friends/friends.module';
import { StatsModule } from '../stats/stats.module';
import { StreaksModule } from '../streaks/streaks.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeParticipant]),
    UsersModule,
    FriendsModule,
    StatsModule,
    StreaksModule,
    AnalyticsModule,
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, ChallengesQueryRepository, ChallengesCommandRepository],
  exports: [ChallengesService],
})
export class ChallengesModule {}
