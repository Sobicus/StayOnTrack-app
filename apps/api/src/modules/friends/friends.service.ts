import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from './entities/friend-request.entity';
import { Friendship } from './entities/friendship.entity';
import { UsersService } from '../users/users.service';
import { LeaderboardEntryDto } from './dto/friend-response.dto';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendRequest)
    private readonly requestRepository: Repository<FriendRequest>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Send a friend request by username.
   */
  async sendRequest(fromUserId: string, toUsername: string): Promise<FriendRequest> {
    const toUser = await this.usersService.findByUsername(toUsername);
    if (!toUser) {
      throw new NotFoundException('User not found');
    }

    if (toUser.id === fromUserId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if already friends
    const existing = await this.friendshipRepository.findOne({
      where: { userId: fromUserId, friendId: toUser.id },
    });
    if (existing) {
      throw new ConflictException('Already friends with this user');
    }

    // Check if request already exists (in either direction)
    const existingRequest = await this.requestRepository.findOne({
      where: [
        { fromUserId, toUserId: toUser.id, status: FriendRequestStatus.PENDING },
        { fromUserId: toUser.id, toUserId: fromUserId, status: FriendRequestStatus.PENDING },
      ],
    });
    if (existingRequest) {
      throw new ConflictException('A pending friend request already exists');
    }

    const request = this.requestRepository.create({
      fromUserId,
      toUserId: toUser.id,
      status: FriendRequestStatus.PENDING,
    });

    const saved = await this.requestRepository.save(request);

    // Reload with relations
    return this.requestRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['fromUser', 'toUser'],
    });
  }

  /**
   * Get incoming friend requests for a user.
   */
  async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
    return this.requestRepository.find({
      where: { toUserId: userId, status: FriendRequestStatus.PENDING },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get outgoing friend requests for a user.
   */
  async getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    return this.requestRepository.find({
      where: { fromUserId: userId, status: FriendRequestStatus.PENDING },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Accept a friend request. Creates bidirectional friendship records.
   */
  async acceptRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, toUserId: userId, status: FriendRequestStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Update request status
    request.status = FriendRequestStatus.ACCEPTED;
    await this.requestRepository.save(request);

    // Create bidirectional friendship (A→B and B→A for simpler querying)
    const friendship1 = this.friendshipRepository.create({
      userId: request.fromUserId,
      friendId: request.toUserId,
    });
    const friendship2 = this.friendshipRepository.create({
      userId: request.toUserId,
      friendId: request.fromUserId,
    });

    await this.friendshipRepository.save([friendship1, friendship2]);

    // Invite reward: grant +1 streak shield to the sender (no limit)
    await this.usersService.addShields(request.fromUserId, 1);
  }

  /**
   * Decline a friend request.
   */
  async declineRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, toUserId: userId, status: FriendRequestStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    request.status = FriendRequestStatus.DECLINED;
    await this.requestRepository.save(request);
  }

  /**
   * Get all friends for a user.
   */
  async getFriends(userId: string): Promise<Friendship[]> {
    return this.friendshipRepository.find({
      where: { userId },
      relations: ['friend'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Remove a friendship (bidirectional).
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = await this.friendshipRepository.findOne({
      where: { userId, friendId },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Remove both directions
    await this.friendshipRepository.delete({ userId, friendId });
    await this.friendshipRepository.delete({ userId: friendId, friendId: userId });
  }

  /**
   * Get friend count for a user.
   */
  async getFriendCount(userId: string): Promise<number> {
    return this.friendshipRepository.count({ where: { userId } });
  }

  /**
   * Check if two users are friends.
   */
  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: { userId, friendId: otherUserId },
    });
    return !!friendship;
  }

  /**
   * Get friends leaderboard by metric (savedCalories, savedMoney, streak).
   * Queries stats for the user and all their friends.
   */
  async getFriendsLeaderboard(
    userId: string,
    metric: string = 'savedCalories',
  ): Promise<LeaderboardEntryDto[]> {
    // Get friend IDs
    const friendships = await this.friendshipRepository.find({
      where: { userId },
    });
    const friendIds = friendships.map((f) => f.friendId);
    const allIds = [userId, ...friendIds];

    if (allIds.length === 0) {
      return [];
    }

    // Get stats for all users using raw query for flexibility
    const metricColumn = this.getMetricColumn(metric);

    const results = await this.friendshipRepository.manager.query(
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

    return results.map((row: { userId: string; username: string; avatarUrl: string | null; totalCalories: string; totalMoney: string }, index: number) => {
      const entry = new LeaderboardEntryDto();
      entry.userId = row.userId;
      entry.username = row.username;
      entry.avatarUrl = row.avatarUrl;
      entry.value = metric === 'savedMoney'
        ? parseFloat(row.totalMoney)
        : parseFloat(row.totalCalories);
      entry.rank = index + 1;
      return entry;
    });
  }

  private getMetricColumn(metric: string): string {
    switch (metric) {
      case 'savedMoney':
        return '"totalMoney"';
      case 'savedCalories':
      default:
        return '"totalCalories"';
    }
  }
}
