import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequest } from './entities/friend-request.entity';
import { Friendship } from './entities/friendship.entity';
import { FriendsService } from './services/friends.service';
import { FriendsController } from './controllers/friends.controller';
import { FriendsQueryRepository } from './repositories/friends.query.repository';
import { FriendsCommandRepository } from './repositories/friends.command.repository';
import { UsersModule } from '../users/users.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequest, Friendship]),
    UsersModule,
    GamificationModule,
  ],
  controllers: [FriendsController],
  providers: [FriendsService, FriendsQueryRepository, FriendsCommandRepository],
  exports: [FriendsService],
})
export class FriendsModule {}
