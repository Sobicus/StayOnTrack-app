import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendRequest, FriendRequestStatus } from './entities/friend-request.entity';
import { Friendship } from './entities/friendship.entity';
import { UsersService } from '../users/users.service';

describe('FriendsService', () => {
  let service: FriendsService;
  let requestRepository: any;
  let friendshipRepository: any;
  let usersService: any;

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
    requestRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((data) => ({ ...data, id: 'req-1', createdAt: new Date() })),
      save: jest.fn((data) => {
        if (Array.isArray(data)) return Promise.resolve(data);
        return Promise.resolve({ ...data, id: data.id || 'req-1' });
      }),
    };

    friendshipRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((data) => ({ ...data, id: 'fs-1', createdAt: new Date() })),
      save: jest.fn((data) => {
        if (Array.isArray(data)) return Promise.resolve(data);
        return Promise.resolve(data);
      }),
      delete: jest.fn(),
      manager: {
        query: jest.fn().mockResolvedValue([]),
      },
    };

    usersService = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      addShields: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: getRepositoryToken(FriendRequest), useValue: requestRepository },
        { provide: getRepositoryToken(Friendship), useValue: friendshipRepository },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  describe('sendRequest', () => {
    it('should send a friend request successfully', async () => {
      usersService.findByUsername.mockResolvedValue(mockFriend);
      requestRepository.findOne.mockResolvedValue(null);
      requestRepository.findOneOrFail.mockResolvedValue({
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
      expect(requestRepository.create).toHaveBeenCalled();
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
      friendshipRepository.findOne.mockResolvedValue({ id: 'fs-1' });

      await expect(
        service.sendRequest('user-1', 'bob'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if pending request already exists', async () => {
      usersService.findByUsername.mockResolvedValue(mockFriend);
      friendshipRepository.findOne.mockResolvedValue(null);
      requestRepository.findOne.mockResolvedValue({ id: 'req-existing' });

      await expect(
        service.sendRequest('user-1', 'bob'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptRequest', () => {
    it('should accept a request and create bidirectional friendship', async () => {
      const pendingRequest = {
        id: 'req-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: FriendRequestStatus.PENDING,
      };
      requestRepository.findOne.mockResolvedValue(pendingRequest);

      await service.acceptRequest('req-1', 'user-2');

      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendRequestStatus.ACCEPTED }),
      );
      // Should create bidirectional friendship (save called with array)
      expect(friendshipRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1', friendId: 'user-2' }),
          expect.objectContaining({ userId: 'user-2', friendId: 'user-1' }),
        ]),
      );
      // Should award invite shield to the sender
      expect(usersService.addShields).toHaveBeenCalledWith('user-1', 1);
    });

    it('should throw if request not found', async () => {
      requestRepository.findOne.mockResolvedValue(null);

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
      requestRepository.findOne.mockResolvedValue(pendingRequest);

      await service.declineRequest('req-1', 'user-2');

      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendRequestStatus.DECLINED }),
      );
    });
  });

  describe('removeFriend', () => {
    it('should remove both directions of friendship', async () => {
      friendshipRepository.findOne.mockResolvedValue({ id: 'fs-1' });

      await service.removeFriend('user-1', 'user-2');

      expect(friendshipRepository.delete).toHaveBeenCalledTimes(2);
      expect(friendshipRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
        friendId: 'user-2',
      });
      expect(friendshipRepository.delete).toHaveBeenCalledWith({
        userId: 'user-2',
        friendId: 'user-1',
      });
    });

    it('should throw if friendship not found', async () => {
      friendshipRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFriend('user-1', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('areFriends', () => {
    it('should return true if friends', async () => {
      friendshipRepository.findOne.mockResolvedValue({ id: 'fs-1' });

      const result = await service.areFriends('user-1', 'user-2');
      expect(result).toBe(true);
    });

    it('should return false if not friends', async () => {
      friendshipRepository.findOne.mockResolvedValue(null);

      const result = await service.areFriends('user-1', 'user-2');
      expect(result).toBe(false);
    });
  });
});
