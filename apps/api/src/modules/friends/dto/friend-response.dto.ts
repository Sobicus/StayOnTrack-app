import { FriendRequest } from '../entities/friend-request.entity';
import { Friendship } from '../entities/friendship.entity';

export class FriendRequestResponseDto {
  id!: string;
  fromUserId!: string;
  fromUsername!: string;
  toUserId!: string;
  toUsername!: string;
  status!: string;
  createdAt!: Date;

  static fromEntity(req: FriendRequest): FriendRequestResponseDto {
    const dto = new FriendRequestResponseDto();
    dto.id = req.id;
    dto.fromUserId = req.fromUserId;
    dto.fromUsername = req.fromUser?.username || '';
    dto.toUserId = req.toUserId;
    dto.toUsername = req.toUser?.username || '';
    dto.status = req.status;
    dto.createdAt = req.createdAt;
    return dto;
  }
}

export class FriendResponseDto {
  id!: string;
  friendId!: string;
  username!: string;
  avatarUrl!: string | null;
  since!: Date;

  static fromEntity(friendship: Friendship): FriendResponseDto {
    const dto = new FriendResponseDto();
    dto.id = friendship.id;
    dto.friendId = friendship.friendId;
    dto.username = friendship.friend?.username || '';
    dto.avatarUrl = friendship.friend?.avatarUrl || null;
    dto.since = friendship.createdAt;
    return dto;
  }
}

export class LeaderboardEntryDto {
  userId!: string;
  username!: string;
  avatarUrl!: string | null;
  value!: number;
  rank!: number;
}
