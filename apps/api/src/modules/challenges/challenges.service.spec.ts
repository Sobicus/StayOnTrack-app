import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChallengesService } from './services/challenges.service';
import { UsersService } from '../users/services/users.service';
import { FriendsService } from '../friends/services/friends.service';
import { StatsService } from '../stats/services/stats.service';
import { StreaksService } from '../streaks/services/streaks.service';
import { ChallengeType, ChallengeStatus, ChallengeParticipantStatus } from '@stayontrack/contracts';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { ChallengesQueryRepository } from './repositories/challenges.query.repository';
import { ChallengesCommandRepository } from './repositories/challenges.command.repository';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let queryRepo: any;
  let commandRepo: any;
  let usersService: any;
  let friendsService: any;
  let statsService: any;
  let streaksService: any;
  let analyticsService: any;

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

  const mockChallenge: any = {
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
    queryRepo = {
      findParticipationsByUser: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn().mockResolvedValue([]),
      findOneWithRelations: jest.fn().mockResolvedValue({
        ...mockChallenge,
        creator: mockUser,
        winner: null,
        participants: [
          { id: 'p-1', userId: 'user-1', status: ChallengeParticipantStatus.ACCEPTED, currentValue: 0, user: mockUser },
          { id: 'p-2', userId: 'user-2', status: ChallengeParticipantStatus.INVITED, currentValue: 0, user: mockFriend },
        ],
      }),
      findById: jest.fn().mockResolvedValue(null),
      findByInviteCode: jest.fn().mockResolvedValue(null),
      findByIdWithParticipants: jest.fn().mockResolvedValue(null),
      findParticipant: jest.fn().mockResolvedValue(null),
      findPendingInvitations: jest.fn().mockResolvedValue([]),
      findPublicChallenges: jest.fn().mockResolvedValue([]),
      countAcceptedParticipations: jest.fn().mockResolvedValue(0),
      countWins: jest.fn().mockResolvedValue(0),
      countAvoidedHabitLogs: jest.fn().mockResolvedValue(5),
    };

    commandRepo = {
      createChallenge: jest.fn((data) => ({ ...data, id: 'challenge-1', createdAt: new Date() })),
      saveChallenge: jest.fn((data) => Promise.resolve(data)),
      createParticipant: jest.fn((data) => ({ ...data, id: `p-${Date.now()}`, joinedAt: new Date() })),
      saveParticipants: jest.fn((data) => Promise.resolve(Array.isArray(data) ? data : data)),
      saveParticipant: jest.fn((data) => Promise.resolve(data)),
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

    analyticsService = {
      trackEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: ChallengesQueryRepository, useValue: queryRepo },
        { provide: ChallengesCommandRepository, useValue: commandRepo },
        { provide: UsersService, useValue: usersService },
        { provide: FriendsService, useValue: friendsService },
        { provide: StatsService, useValue: statsService },
        { provide: StreaksService, useValue: streaksService },
        { provide: AnalyticsService, useValue: analyticsService },
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

      expect(commandRepo.createChallenge).toHaveBeenCalled();
      expect(commandRepo.saveChallenge).toHaveBeenCalled();
      expect(commandRepo.saveParticipants).toHaveBeenCalledWith(
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
      queryRepo.findParticipant.mockResolvedValue(invitation);

      await service.acceptChallenge('challenge-1', 'user-2');

      expect(commandRepo.saveParticipant).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ChallengeParticipantStatus.ACCEPTED,
        }),
      );
    });

    it('should throw if invitation not found', async () => {
      queryRepo.findParticipant.mockResolvedValue(null);

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
      queryRepo.findParticipant.mockResolvedValue(invitation);

      await service.declineChallenge('challenge-1', 'user-2');

      expect(commandRepo.saveParticipant).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ChallengeParticipantStatus.DECLINED,
        }),
      );
    });
  });

  describe('cancelChallenge', () => {
    it('should allow creator to cancel', async () => {
      queryRepo.findById.mockResolvedValue({
        ...mockChallenge,
        status: ChallengeStatus.ACTIVE,
      });

      await service.cancelChallenge('challenge-1', 'user-1');

      expect(commandRepo.saveChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ChallengeStatus.CANCELLED,
        }),
      );
    });

    it('should throw if not the creator', async () => {
      queryRepo.findById.mockResolvedValue({
        ...mockChallenge,
        status: ChallengeStatus.ACTIVE,
      });

      await expect(
        service.cancelChallenge('challenge-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if challenge is already completed', async () => {
      queryRepo.findById.mockResolvedValue({
        ...mockChallenge,
        status: ChallengeStatus.COMPLETED,
      });

      await expect(
        service.cancelChallenge('challenge-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if challenge not found', async () => {
      queryRepo.findById.mockResolvedValue(null);

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
      queryRepo.countAcceptedParticipations.mockResolvedValue(3);
      const result = await service.getChallengeCount('user-1');
      expect(result).toBe(3);
    });
  });

  describe('getWinCount', () => {
    it('should return win count', async () => {
      queryRepo.countWins.mockResolvedValue(2);
      const result = await service.getWinCount('user-1');
      expect(result).toBe(2);
    });
  });

  // ── joinByCode ──────────────────────────────────────────────────

  describe('joinByCode', () => {
    const activeChallenge = {
      ...mockChallenge,
      inviteCode: 'abc12345',
      maxParticipants: 5,
      participants: [
        { userId: 'user-1', status: ChallengeParticipantStatus.ACCEPTED },
      ],
    };

    it('should join a challenge by valid invite code', async () => {
      queryRepo.findByInviteCode.mockResolvedValue({ ...activeChallenge });

      const result = await service.joinByCode('user-3', 'abc12345');

      expect(commandRepo.createParticipant).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-3',
          status: ChallengeParticipantStatus.ACCEPTED,
        }),
      );
      expect(commandRepo.saveParticipant).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid invite code', async () => {
      queryRepo.findByInviteCode.mockResolvedValue(null);

      await expect(
        service.joinByCode('user-3', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if challenge is not active', async () => {
      queryRepo.findByInviteCode.mockResolvedValue({
        ...activeChallenge,
        status: ChallengeStatus.COMPLETED,
      });

      await expect(
        service.joinByCode('user-3', 'abc12345'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is already a participant', async () => {
      queryRepo.findByInviteCode.mockResolvedValue({
        ...activeChallenge,
        participants: [
          { userId: 'user-3', status: ChallengeParticipantStatus.ACCEPTED },
        ],
      });

      await expect(
        service.joinByCode('user-3', 'abc12345'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if challenge is full', async () => {
      queryRepo.findByInviteCode.mockResolvedValue({
        ...activeChallenge,
        maxParticipants: 2,
        participants: [
          { userId: 'user-1', status: ChallengeParticipantStatus.ACCEPTED },
          { userId: 'user-2', status: ChallengeParticipantStatus.ACCEPTED },
        ],
      });

      await expect(
        service.joinByCode('user-3', 'abc12345'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if challenge has ended', async () => {
      queryRepo.findByInviteCode.mockResolvedValue({
        ...activeChallenge,
        endDate: '2020-01-01',
      });

      await expect(
        service.joinByCode('user-3', 'abc12345'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── findPublicChallenges ────────────────────────────────────────

  describe('findPublicChallenges', () => {
    it('should delegate to query repository', async () => {
      queryRepo.findPublicChallenges.mockResolvedValue([]);

      const result = await service.findPublicChallenges('user-1');

      expect(queryRepo.findPublicChallenges).toHaveBeenCalledWith('user-1', expect.any(String));
      expect(result).toEqual([]);
    });
  });
});
