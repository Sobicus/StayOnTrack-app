import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FriendRequest, FriendRequestStatus } from '../entities/friend-request.entity';
import { Friendship } from '../entities/friendship.entity';
import { UsersService } from '../../users/services/users.service';
import { GamificationService } from '../../gamification/services/gamification.service';
import { LeaderboardEntryDto } from '../dto/friend-response.dto';
import { XP_REWARDS } from '@stayontrack/contracts';
import { FriendsQueryRepository } from '../repositories/friends.query.repository';
import { FriendsCommandRepository } from '../repositories/friends.command.repository';

@Injectable()
export class FriendsService {
  constructor(
    private readonly queryRepo: FriendsQueryRepository,
    private readonly commandRepo: FriendsCommandRepository,
    private readonly usersService: UsersService,
    private readonly gamificationService: GamificationService,
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
    const existing = await this.queryRepo.findFriendship(fromUserId, toUser.id);
    if (existing) {
      throw new ConflictException('Already friends with this user');
    }

    // Check if request already exists (in either direction)
    const existingRequest = await this.queryRepo.findPendingRequestBetween(fromUserId, toUser.id);
    if (existingRequest) {
      throw new ConflictException('A pending friend request already exists');
    }

    const request = this.commandRepo.createRequest({
      fromUserId,
      toUserId: toUser.id,
      status: FriendRequestStatus.PENDING,
    });

    const saved = await this.commandRepo.saveRequest(request);

    // Reload with relations
    return this.queryRepo.findRequestByIdWithRelations(saved.id);
  }

  /**
   * Get incoming friend requests for a user.
   */
  async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
    return this.queryRepo.findIncomingRequests(userId);
  }

  /**
   * Get outgoing friend requests for a user.
   */
  async getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    return this.queryRepo.findOutgoingRequests(userId);
  }

  /**
   * Accept a friend request. Creates bidirectional friendship records.
   */
  async acceptRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.queryRepo.findRequestById(requestId, userId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Update request status
    request.status = FriendRequestStatus.ACCEPTED;
    await this.commandRepo.saveRequest(request);

    // Create bidirectional friendship (A->B and B->A for simpler querying)
    const friendship1 = this.commandRepo.createFriendship({
      userId: request.fromUserId,
      friendId: request.toUserId,
    });
    const friendship2 = this.commandRepo.createFriendship({
      userId: request.toUserId,
      friendId: request.fromUserId,
    });

    await this.commandRepo.saveFriendships([friendship1, friendship2]);

    // Invite reward: grant shields + XP to both users (only once per request)
    if (!request.inviteRewardClaimed) {
      await this.usersService.addShields(request.fromUserId, 1);
      await this.usersService.addShields(request.toUserId, 1);
      await this.gamificationService.addXp(request.fromUserId, XP_REWARDS.INVITE_ACCEPT);
      await this.gamificationService.addXp(request.toUserId, XP_REWARDS.INVITE_ACCEPT);
      request.inviteRewardClaimed = true;
      await this.commandRepo.saveRequest(request);
    }
  }

  /**
   * Decline a friend request.
   */
  async declineRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.queryRepo.findRequestById(requestId, userId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    request.status = FriendRequestStatus.DECLINED;
    await this.commandRepo.saveRequest(request);
  }

  /**
   * Get all friends for a user.
   */
  async getFriends(userId: string): Promise<Friendship[]> {
    return this.queryRepo.findAllFriendships(userId);
  }

  /**
   * Remove a friendship (bidirectional).
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = await this.queryRepo.findFriendship(userId, friendId);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Remove both directions
    await this.commandRepo.deleteFriendship(userId, friendId);
    await this.commandRepo.deleteFriendship(friendId, userId);
  }

  /**
   * Get friend count for a user.
   */
  async getFriendCount(userId: string): Promise<number> {
    return this.queryRepo.countFriendships(userId);
  }

  /**
   * Check if two users are friends.
   */
  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await this.queryRepo.findFriendship(userId, otherUserId);
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
    const friendIds = await this.queryRepo.findFriendIds(userId);
    const allIds = [userId, ...friendIds];

    if (allIds.length === 0) {
      return [];
    }

    // Get stats for all users using raw query for flexibility
    const metricColumn = this.getMetricColumn(metric);

    const results = await this.queryRepo.getLeaderboardStats(allIds, metricColumn);

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
