import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from '../entities/friend-request.entity';
import { Friendship } from '../entities/friendship.entity';

@Injectable()
export class FriendsQueryRepository {
  constructor(
    @InjectRepository(FriendRequest)
    private readonly requestRepository: Repository<FriendRequest>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
  ) {}

  // ── Friend Request Queries ──────────────────────────────────────

  async findPendingRequestBetween(
    fromUserId: string,
    toUserId: string,
  ): Promise<FriendRequest | null> {
    return this.requestRepository.findOne({
      where: [
        { fromUserId, toUserId, status: FriendRequestStatus.PENDING },
        { fromUserId: toUserId, toUserId: fromUserId, status: FriendRequestStatus.PENDING },
      ],
    });
  }

  async findRequestById(
    requestId: string,
    toUserId: string,
  ): Promise<FriendRequest | null> {
    return this.requestRepository.findOne({
      where: { id: requestId, toUserId, status: FriendRequestStatus.PENDING },
    });
  }

  async findRequestByIdWithRelations(requestId: string): Promise<FriendRequest> {
    return this.requestRepository.findOneOrFail({
      where: { id: requestId },
      relations: ['fromUser', 'toUser'],
    });
  }

  async findIncomingRequests(userId: string): Promise<FriendRequest[]> {
    return this.requestRepository.find({
      where: { toUserId: userId, status: FriendRequestStatus.PENDING },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    return this.requestRepository.find({
      where: { fromUserId: userId, status: FriendRequestStatus.PENDING },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Friendship Queries ──────────────────────────────────────────

  async findFriendship(userId: string, friendId: string): Promise<Friendship | null> {
    return this.friendshipRepository.findOne({
      where: { userId, friendId },
    });
  }

  async findAllFriendships(userId: string): Promise<Friendship[]> {
    return this.friendshipRepository.find({
      where: { userId },
      relations: ['friend'],
      order: { createdAt: 'DESC' },
    });
  }

  async countFriendships(userId: string): Promise<number> {
    return this.friendshipRepository.count({ where: { userId } });
  }

  async findFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.friendshipRepository.find({
      where: { userId },
    });
    return friendships.map((f) => f.friendId);
  }

  async getLeaderboardStats(
    allIds: string[],
    metricColumn: string,
  ): Promise<any[]> {
    return this.friendshipRepository.manager.query(
      `SELECT u.id as "userId", u.username, u."avatarUrl",
              COALESCE(SUM(hl."savedCalories"), 0) as "totalCalories",
              COALESCE(SUM(hl."savedMoney"), 0) as "totalMoney"
       FROM users u
       LEFT JOIN habit_logs hl ON hl."userId" = u.id
       WHERE u.id = ANY($1)
       GROUP BY u.id, u.username, u."avatarUrl"
       ORDER BY ${metricColumn} DESC`,
      [allIds],
    );
  }
}
