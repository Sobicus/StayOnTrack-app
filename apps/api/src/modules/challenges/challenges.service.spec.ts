import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { Challenge } from './entities/challenge.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { UsersService } from '../users/users.service';
import { FriendsService } from '../friends/friends.service';
import { StatsService } from '../stats/stats.service';
import { StreaksService } from '../streaks/streaks.service';
import { ChallengeType, ChallengeStatus, ChallengeParticipantStatus } from '@stayontrack/contracts';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let challengeRepo: any;
  let participantRepo: any;
  let usersService: any;
  let friendsService: any;
  let statsService: any;
  let streaksService: any;

  const mockUser = { id: 'user-1', username: 'alice' };
  const mockFriend = { id: 'user-2', username: 'bob' };

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const nextWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  const mockChallenge: Partial<Challenge> = {
    id: 'challenge-1',
    creatorUserId: 'user-1',
    title: 'No Sweets Week',
    type: ChallengeType.CALORIES,
    targetValue: 1000,
    startDate: tomorrow,
    endDate: nextWeek,
    status: ChallengeStatus.ACTIVE,
    participants: [],
  };

  beforeEach(async () => {
    challengeRepo = {
      create: jest.fn((data) => ({ ...data, id: 'challenge-1', createdAt: new Date() })),
      save: jest.fn((data) => Promise.resolve(data)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findOneOrFail: jest.fn().mockResolvedValue({
        ...mockChallenge,
        creator: mockUser,
        winner: null,
        participants: [
          { id: 'p-1', userId: 'user-1', status: ChallengeParticipantStatus.ACCEPTED, currentValue: 0, user: mockUser },
          { id: 'p-2', userId: 'user-2', status: ChallengeParticipantStatus.INVITED, currentValue: 0, user: mockFriend },
        ],
      }),
      count: jest.fn().mockResolvedValue(0),
      manager: { query: jest.fn().mockResolvedValue([{ count: '5' }]) },
    };

    participantRepo = {
      create: jest.fn((data) => ({ ...data, id: `p-${Date.now()}`, joinedAt: new Date() })),
      save: jest.fn((data) => Promise.resolve(Array.isArray(data) ? data : data)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    };

    usersService = {
      findByUsername: jest.fn().mockResolvedValue(mockFriend),
    };

    friendsService = {
      areFriends: jest.fn().mockResolvedValue(true),
    };

    statsService = {
      getStatsByDateRange: jest.fn().mockResolvedValue({
        totalSavedCalories: 500,
        totalSavedMoney: 25,
        potentialWeightAvoidedKg: 0.065,
        totalCheckIns: 10,
        totalDaysTracked: 5,
      }),
    };

    streaksService = {
      getStreak: jest.fn().mockResolvedValue({
        currentStreak: 7,
        bestStreak: 14,
        streakShieldsRemaining: 1,
        lastCheckinDate: null,
        isShieldActive: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: getRepositoryToken(Challenge), useValue: challengeRepo },
        { provide: getRepositoryToken(ChallengeParticipant), useValue: participantRepo },
        { provide: UsersService, useValue: usersService },
        { provide: FriendsService, useValue: friendsService },
        { provide: StatsService, useValue: statsService },
        { provide: StreaksService, useValue: streaksService },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
  });

  describe('create', () => {
    const validDto = {
      title: 'No Sweets Week',
      type: ChallengeType.CALORIES,
      targetValue: 1000,
      startDate: tomorrow,
      endDate: nextWeek,
      inviteUsername: 'bob',
    };

    it('should create a challenge and invite a friend', async () => {
      const result = await service.create('user-1', validDto);

      expect(challengeRepo.create).toHaveBeenCalled();
      expect(challengeRepo.save).toHaveBeenCalled();
      expect(participantRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1', status: ChallengeParticipantStatus.ACCEPTED }),
          expect.objectContaining({ userId: 'user-2', status: ChallengeParticipantStatus.INVITED }),
        ]),
      );
    });

    it('should throw if invited user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(service.create('user-1', validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if challenging yourself', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.create('user-1', validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if not friends', async () => {
      friendsService.areFriends.mockResolvedValue(false);

      await expect(service.create('user-1', validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if start date is in the past', async () => {
      await expect(
        service.create('user-1', { ...validDto, startDate: '2020-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if end date is before start date', async () => {
      await expect(
        service.create('user-1', { ...validDto, endDate: validDto.startDate }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if HABIT type without habitId', async () => {
      await expect(
        service.create('user-1', {
          ...validDto,
          type: ChallengeType.HABIT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptChallenge', () => {
    it('should accept a pending invitation', async () => {
      const invitation = {
        id: 'p-2',
        challengeId: 'challenge-1',
        userId: 'user-2',
        status: ChallengeParticipantStatus.INVITED,
      };
      participantRepo.findOne.mockResolvedValue(invitation);

      await service.acceptChallenge('challenge-1', 'user-2');

      expect(participantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ChallengeParticipantStatus.ACCEPTED,
        }),
      );
    });

    it('should throw if invitation not found', async () => {
      participantRepo.findOne.mockResolvedValue(null);

      await expect(
        service.acceptChallenge('challenge-1', 'user-3'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('declineChallenge', () => {
    it('should decline a pending invitation', async () => {
      const invitation = {
        id: 'p-2',
        challengeId: 'challenge-1',
        userId: 'user-2',
        status: ChallengeParticipantStatus.INVITED,
      };
      participantRepo.findOne.mockResolvedValue(invitation);

      await service.declineChallenge('challenge-1', 'user-2');

      expect(participantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ChallengeParticipantStatus.DECLINED,
        }),
      );
    });
  });

  describe('cancelChallenge', () => {
    it('should allow creator to cancel', async () => {
      challengeRepo.findOne.mockResolvedValue({
        ...mockChallenge,
        status: ChallengeStatus.ACTIVE,
      });

      await service.cancelChallenge('challenge-1', 'user-1');

      expect(challengeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ChallengeStatus.CANCELLED,
        }),
      );
    });

    it('should throw if not the creator', async () => {
      challengeRepo.findOne.mockResolvedValue({
        ...mockChallenge,
        status: ChallengeStatus.ACTIVE,
      });

      await expect(
        service.cancelChallenge('challenge-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if challenge is already completed', async () => {
      challengeRepo.findOne.mockResolvedValue({
        ...mockChallenge,
        status: ChallengeStatus.COMPLETED,
      });

      await expect(
        service.cancelChallenge('challenge-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if challenge not found', async () => {
      challengeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelChallenge('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByUser', () => {
    it('should return challenge if user is participant', async () => {
      const result = await service.findOneByUser('challenge-1', 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('challenge-1');
    });

    it('should throw if user is not a participant', async () => {
      await expect(
        service.findOneByUser('challenge-1', 'user-3'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getChallengeCount', () => {
    it('should return participant count', async () => {
      participantRepo.count.mockResolvedValue(3);
      const result = await service.getChallengeCount('user-1');
      expect(result).toBe(3);
    });
  });

  describe('getWinCount', () => {
    it('should return win count', async () => {
      challengeRepo.count.mockResolvedValue(2);
      const result = await service.getWinCount('user-1');
      expect(result).toBe(2);
    });
  });
});
