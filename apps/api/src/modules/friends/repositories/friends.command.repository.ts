import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest } from '../entities/friend-request.entity';
import { Friendship } from '../entities/friendship.entity';

@Injectable()
export class FriendsCommandRepository {
  constructor(
    @InjectRepository(FriendRequest)
    private readonly requestRepository: Repository<FriendRequest>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
  ) {}

  // ── Friend Request Commands ─────────────────────────────────────

  createRequest(data: Partial<FriendRequest>): FriendRequest {
    return this.requestRepository.create(data);
  }

  async saveRequest(request: FriendRequest): Promise<FriendRequest> {
    return this.requestRepository.save(request);
  }

  // ── Friendship Commands ─────────────────────────────────────────

  createFriendship(data: Partial<Friendship>): Friendship {
    return this.friendshipRepository.create(data);
  }

  async saveFriendships(friendships: Friendship[]): Promise<Friendship[]> {
    return this.friendshipRepository.save(friendships);
  }

  async deleteFriendship(userId: string, friendId: string): Promise<void> {
    await this.friendshipRepository.delete({ userId, friendId });
  }
}
