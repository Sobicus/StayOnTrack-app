import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FriendsService } from './services/friends.service';
import { FriendRequestStatus } from './entities/friend-request.entity';
import { UsersService } from '../users/services/users.service';
import { GamificationService } from '../gamification/services/gamification.service';
import { FriendsQueryRepository } from './repositories/friends.query.repository';
import { FriendsCommandRepository } from './repositories/friends.command.repository';

describe('FriendsService', () => {
  let service: FriendsService;
  let queryRepo: any;
  let commandRepo: any;
  let usersService: any;
  let gamificationService: any;

  const mockUser = {
    id: 'user-1',
    username: 'alice',
    email: 'alice@test.com',
  };

  const mockFriend = {
    id: 'user-2',
    username: 'bob',
    email: 'bob@test.com',
  };

  beforeEach(async () => {
    queryRepo = {
      findPendingRequestBetween: jest.fn().mockResolvedValue(null),
      findRequestById: jest.fn().mockResolvedValue(null),
      findRequestByIdWithRelations: jest.fn().mockResolvedValue(null),
      findIncomingRequests: jest.fn().mockResolvedValue([]),
      findOutgoingRequests: jest.fn().mockResolvedValue([]),
      findFriendship: jest.fn().mockResolvedValue(null),
      findAllFriendships: jest.fn().mockResolvedValue([]),
      countFriendships: jest.fn().mockResolvedValue(0),
      findFriendIds: jest.fn().mockResolvedValue([]),
      getLeaderboardStats: jest.fn().mockResolvedValue([]),
    };

    commandRepo = {
      createRequest: jest.fn((data) => ({ ...data, id: 'req-1', createdAt: new Date() })),
      saveRequest: jest.fn((data) => Promise.resolve({ ...data, id: data.id || 'req-1' })),
      createFriendship: jest.fn((data) => ({ ...data, id: 'fs-1', createdAt: new Date() })),
      saveFriendships: jest.fn((data) => Promise.resolve(data)),
      deleteFriendship: jest.fn().mockResolvedValue(undefined),
    };

    usersService = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      addShields: jest.fn().mockResolvedValue(undefined),
    };

    gamificationService = {
      addXp: jest.fn().mockResolvedValue({ totalXp: 50, level: 1, levelUp: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: FriendsQueryRepository, useValue: queryRepo },
        { provide: FriendsCommandRepository, useValue: commandRepo },
        { provide: UsersService, useValue: usersService },
        { provide: GamificationService, useValue: gamificationService },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  describe('sendRequest', () => {
    it('should send a friend request successfully', async () => {
      usersService.findByUsername.mockResolvedValue(mockFriend);
      queryRepo.findRequestByIdWithRelations.mockResolvedValue({
        id: 'req-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: FriendRequestStatus.PENDING,
        fromUser: mockUser,
        toUser: mockFriend,
        createdAt: new Date(),
      });

      const result = await service.sendRequest('user-1', 'bob');

      expect(result.fromUserId).toBe('user-1');
      expect(result.toUserId).toBe('user-2');
      expect(commandRepo.createRequest).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.sendRequest('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if sending request to self', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);

      await expect(
        service.sendRequest('user-1', 'alice'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if already friends', async () => {
      usersService.findByUsername.mockResolvedValue(mockFriend);
      queryRepo.findFriendship.mockResolvedValue({ id: 'fs-1' });

      await expect(
        service.sendRequest('user-1', 'bob'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if pending request already exists', async () => {
      usersService.findByUsername.mockResolvedValue(mockFriend);
      queryRepo.findFriendship.mockResolvedValue(null);
      queryRepo.findPendingRequestBetween.mockResolvedValue({ id: 'req-existing' });

      await expect(
        service.sendRequest('user-1', 'bob'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptRequest', () => {
    it('should accept a request and create bidirectional friendship with rewards', async () => {
      const pendingRequest = {
        id: 'req-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: FriendRequestStatus.PENDING,
        inviteRewardClaimed: false,
      };
      queryRepo.findRequestById.mockResolvedValue(pendingRequest);

      await service.acceptRequest('req-1', 'user-2');

      expect(commandRepo.saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendRequestStatus.ACCEPTED }),
      );
      // Should create bidirectional friendship
      expect(commandRepo.saveFriendships).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1', friendId: 'user-2' }),
          expect.objectContaining({ userId: 'user-2', friendId: 'user-1' }),
        ]),
      );
      // Should award invite shield to BOTH users
      expect(usersService.addShields).toHaveBeenCalledWith('user-1', 1);
      expect(usersService.addShields).toHaveBeenCalledWith('user-2', 1);
      // Should award XP to BOTH users
      expect(gamificationService.addXp).toHaveBeenCalledWith('user-1', 50);
      expect(gamificationService.addXp).toHaveBeenCalledWith('user-2', 50);
    });

    it('should throw if request not found', async () => {
      queryRepo.findRequestById.mockResolvedValue(null);

      await expect(
        service.acceptRequest('req-999', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('declineRequest', () => {
    it('should decline a request', async () => {
      const pendingRequest = {
        id: 'req-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: FriendRequestStatus.PENDING,
      };
      queryRepo.findRequestById.mockResolvedValue(pendingRequest);

      await service.declineRequest('req-1', 'user-2');

      expect(commandRepo.saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendRequestStatus.DECLINED }),
      );
    });
  });

  describe('removeFriend', () => {
    it('should remove both directions of friendship', async () => {
      queryRepo.findFriendship.mockResolvedValue({ id: 'fs-1' });

      await service.removeFriend('user-1', 'user-2');

      expect(commandRepo.deleteFriendship).toHaveBeenCalledTimes(2);
      expect(commandRepo.deleteFriendship).toHaveBeenCalledWith('user-1', 'user-2');
      expect(commandRepo.deleteFriendship).toHaveBeenCalledWith('user-2', 'user-1');
    });

    it('should throw if friendship not found', async () => {
      queryRepo.findFriendship.mockResolvedValue(null);

      await expect(
        service.removeFriend('user-1', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('areFriends', () => {
    it('should return true if friends', async () => {
      queryRepo.findFriendship.mockResolvedValue({ id: 'fs-1' });

      const result = await service.areFriends('user-1', 'user-2');
      expect(result).toBe(true);
    });

    it('should return false if not friends', async () => {
      queryRepo.findFriendship.mockResolvedValue(null);

      const result = await service.areFriends('user-1', 'user-2');
      expect(result).toBe(false);
    });
  });
});
