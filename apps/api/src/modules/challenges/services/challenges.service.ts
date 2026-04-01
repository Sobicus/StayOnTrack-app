import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

export interface InviteMultipleParams {
  challengeId: string;
  creatorUserId: string;
  usernames: string[];
}
import {
  ChallengeNotFoundException,
  ChallengeForbiddenException,
  ChallengeAlreadyJoinedException,
} from '../../../common/exceptions/challenge.exception';
import * as crypto from 'crypto';
import { Challenge, ChallengeStatus, ChallengeVisibility } from '../entities/challenge.entity';
import {
  ChallengeParticipant,
  ChallengeParticipantStatus,
} from '../entities/challenge-participant.entity';
import { ChallengeType } from '@stayontrack/contracts';
import { UsersService } from '../../users/services/users.service';
import { FriendsService } from '../../friends/services/friends.service';
import { StatsService } from '../../stats/services/stats.service';
import { StreaksService } from '../../streaks/services/streaks.service';
import { CreateChallengeDto } from '../dto/create-challenge.dto';
import { AnalyticsService } from '../../analytics/services/analytics.service';
import { ChallengesQueryRepository } from '../repositories/challenges.query.repository';
import { ChallengesCommandRepository } from '../repositories/challenges.command.repository';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly challengesQueryRepository: ChallengesQueryRepository,
    private readonly challengesCommandRepository: ChallengesCommandRepository,
    private readonly usersService: UsersService,
    private readonly friendsService: FriendsService,
    private readonly statsService: StatsService,
    private readonly streaksService: StreaksService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Create a new challenge and invite a friend.
   */
  async create(creatorId: string, dto: CreateChallengeDto): Promise<Challenge> {
    // Validate dates
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const today = new Date(this.getTodayDate());

    if (start < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate HABIT type requires habitId
    if (dto.type === ChallengeType.HABIT && !dto.habitId) {
      throw new BadRequestException(
        'habitId is required for HABIT type challenges',
      );
    }

    // Find the invited user
    const invitedUser = await this.usersService.findByUsername(
      dto.inviteUsername,
    );
    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }
    if (invitedUser.id === creatorId) {
      throw new BadRequestException('Cannot challenge yourself');
    }

    // Must be friends
    const areFriends = await this.friendsService.areFriends(
      creatorId,
      invitedUser.id,
    );
    if (!areFriends) {
      throw new BadRequestException('You can only challenge friends');
    }

    // Create challenge
    const inviteCode = crypto.randomBytes(4).toString('hex');
    const challenge = this.challengesCommandRepository.createChallenge({
      creatorUserId: creatorId,
      title: dto.title,
      description: dto.description || null,
      type: dto.type,
      targetValue: dto.targetValue,
      habitId: dto.habitId || null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: ChallengeStatus.ACTIVE,
      maxParticipants: dto.maxParticipants ?? 2,
      inviteCode,
      visibility: dto.visibility ?? ChallengeVisibility.PRIVATE,
    });

    const savedChallenge = await this.challengesCommandRepository.saveChallenge(challenge);

    // Add creator as ACCEPTED participant
    const creatorParticipant = this.challengesCommandRepository.createParticipant({
      challengeId: savedChallenge.id,
      userId: creatorId,
      status: ChallengeParticipantStatus.ACCEPTED,
    });

    // Add invited user as INVITED participant
    const invitedParticipant = this.challengesCommandRepository.createParticipant({
      challengeId: savedChallenge.id,
      userId: invitedUser.id,
      status: ChallengeParticipantStatus.INVITED,
    });

    await this.challengesCommandRepository.saveParticipants([
      creatorParticipant,
      invitedParticipant,
    ]);

    return this.challengesQueryRepository.findOneWithRelations(savedChallenge.id);
  }

  /**
   * Get all challenges for a user (as creator or participant).
   */
  async findAllByUser(userId: string): Promise<Challenge[]> {
    const participations = await this.challengesQueryRepository.findParticipationsByUser(userId);
    const challengeIds = participations.map((p) => p.challengeId);
    return this.challengesQueryRepository.findByIds(challengeIds);
  }

  /**
   * Get a single challenge by ID (with authorization check).
   */
  async findOneByUser(challengeId: string, userId: string): Promise<Challenge> {
    const challenge = await this.challengesQueryRepository.findOneWithRelations(challengeId);

    // Check if user is a participant
    const isParticipant = challenge.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) {
      throw new ChallengeForbiddenException();
    }

    return challenge;
  }

  /**
   * Accept a challenge invitation.
   */
  async acceptChallenge(challengeId: string, userId: string): Promise<void> {
    const participant = await this.challengesQueryRepository.findParticipant(
      challengeId,
      userId,
      ChallengeParticipantStatus.INVITED,
    );

    if (!participant) {
      throw new NotFoundException('Challenge invitation not found');
    }

    participant.status = ChallengeParticipantStatus.ACCEPTED;
    await this.challengesCommandRepository.saveParticipant(participant);
  }

  /**
   * Decline a challenge invitation.
   */
  async declineChallenge(challengeId: string, userId: string): Promise<void> {
    const participant = await this.challengesQueryRepository.findParticipant(
      challengeId,
      userId,
      ChallengeParticipantStatus.INVITED,
    );

    if (!participant) {
      throw new NotFoundException('Challenge invitation not found');
    }

    participant.status = ChallengeParticipantStatus.DECLINED;
    await this.challengesCommandRepository.saveParticipant(participant);
  }

  /**
   * Cancel a challenge (only creator can cancel).
   */
  async cancelChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await this.challengesQueryRepository.findById(challengeId);

    if (!challenge) {
      throw new ChallengeNotFoundException();
    }

    if (challenge.creatorUserId !== userId) {
      throw new ChallengeForbiddenException();
    }

    if (challenge.status === ChallengeStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed challenge');
    }

    challenge.status = ChallengeStatus.CANCELLED;
    await this.challengesCommandRepository.saveChallenge(challenge);
  }

  /**
   * Get challenge progress — calculates currentValue for each participant
   * based on their stats within the challenge date range.
   */
  async getProgress(
    challengeId: string,
    userId: string,
  ): Promise<Challenge> {
    const challenge = await this.findOneByUser(challengeId, userId);

    // Only update progress for active challenges
    if (challenge.status !== ChallengeStatus.ACTIVE) {
      return challenge;
    }

    // Calculate progress for each accepted participant
    for (const participant of challenge.participants) {
      if (
        participant.status !== ChallengeParticipantStatus.ACCEPTED &&
        participant.status !== ChallengeParticipantStatus.INVITED
      ) {
        continue;
      }

      if (participant.status === ChallengeParticipantStatus.INVITED) {
        continue; // Don't calculate for users who haven't accepted
      }

      const value = await this.calculateParticipantProgress(
        participant.userId,
        challenge,
      );

      participant.currentValue = value;
      await this.challengesCommandRepository.saveParticipant(participant);
    }

    // Check if challenge should be completed (end date passed)
    await this.checkAndCompleteChallenge(challenge);

    return this.challengesQueryRepository.findOneWithRelations(challengeId);
  }

  /**
   * Get pending invitations for a user.
   */
  async getPendingInvitations(userId: string): Promise<Challenge[]> {
    return this.challengesQueryRepository.findPendingInvitations(userId);
  }

  /**
   * Calculate a participant's progress value based on challenge type.
   */
  private async calculateParticipantProgress(
    userId: string,
    challenge: Challenge,
  ): Promise<number> {
    switch (challenge.type) {
      case ChallengeType.CALORIES: {
        const stats = await this.statsService.getStatsByDateRange({
          userId,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
        });
        return stats.totalSavedCalories;
      }

      case ChallengeType.MONEY: {
        const stats = await this.statsService.getStatsByDateRange({
          userId,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
        });
        return stats.totalSavedMoney;
      }

      case ChallengeType.STREAK: {
        const streak = await this.streaksService.getStreak(userId);
        return streak.currentStreak;
      }

      case ChallengeType.HABIT: {
        // Count days where this specific habit was AVOIDED within date range
        if (!challenge.habitId) return 0;
        return this.challengesQueryRepository.countAvoidedHabitLogs(
          userId,
          challenge.habitId,
          challenge.startDate,
          challenge.endDate,
        );
      }

      default:
        return 0;
    }
  }

  /**
   * Check if a challenge should be completed and determine the winner.
   */
  private async checkAndCompleteChallenge(
    challenge: Challenge,
  ): Promise<void> {
    const today = this.getTodayDate();
    if (challenge.endDate > today) return; // Not yet ended
    if (challenge.status !== ChallengeStatus.ACTIVE) return;

    // Find the winner — participant with highest currentValue
    const acceptedParticipants = challenge.participants.filter(
      (p) => p.status === ChallengeParticipantStatus.ACCEPTED,
    );

    if (acceptedParticipants.length === 0) {
      challenge.status = ChallengeStatus.CANCELLED;
      await this.challengesCommandRepository.saveChallenge(challenge);
      return;
    }

    // Sort by currentValue desc
    acceptedParticipants.sort((a, b) => b.currentValue - a.currentValue);

    const topValue = acceptedParticipants[0].currentValue;

    // Check if anyone met the target
    if (topValue >= challenge.targetValue) {
      challenge.winnerId = acceptedParticipants[0].userId;
    } else {
      // Even if no one met the target, the highest value wins
      challenge.winnerId = acceptedParticipants[0].userId;
    }

    challenge.status = ChallengeStatus.COMPLETED;
    await this.challengesCommandRepository.saveChallenge(challenge);
  }

  /**
   * Get challenge count for a user.
   */
  async getChallengeCount(userId: string): Promise<number> {
    return this.challengesQueryRepository.countAcceptedParticipations(userId);
  }

  /**
   * Get completed challenge count where user is the winner.
   */
  async getWinCount(userId: string): Promise<number> {
    return this.challengesQueryRepository.countWins(userId);
  }

  /**
   * Join a challenge by invite code.
   */
  async joinByCode(userId: string, code: string): Promise<Challenge> {
    const challenge = await this.challengesQueryRepository.findByInviteCode(code);

    if (!challenge) {
      throw new ChallengeNotFoundException();
    }

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge is not active');
    }

    const today = this.getTodayDate();
    if (challenge.endDate <= today) {
      throw new BadRequestException('Challenge has already ended');
    }

    // Check if user is already a participant
    const existing = challenge.participants.find((p) => p.userId === userId);
    if (existing) {
      throw new ChallengeAlreadyJoinedException();
    }

    // Check participant limit
    const maxParticipants = challenge.maxParticipants;
    if (challenge.participants.length >= maxParticipants) {
      throw new BadRequestException('Challenge has reached the maximum number of participants');
    }

    const participant = this.challengesCommandRepository.createParticipant({
      challengeId: challenge.id,
      userId,
      status: ChallengeParticipantStatus.ACCEPTED,
    });
    await this.challengesCommandRepository.saveParticipant(participant);

    this.analyticsService
      .trackEvent(userId, 'challenge_joined', { challengeId: challenge.id })
      .catch(() => {});

    return this.challengesQueryRepository.findOneWithRelations(challenge.id);
  }

  /**
   * Invite multiple users to a challenge (creator only).
   */
  async inviteMultiple({ challengeId, creatorUserId, usernames }: InviteMultipleParams): Promise<ChallengeParticipant[]> {
    const challenge = await this.challengesQueryRepository.findByIdWithParticipants(challengeId);

    if (!challenge) {
      throw new ChallengeNotFoundException();
    }

    if (challenge.creatorUserId !== creatorUserId) {
      throw new ChallengeForbiddenException();
    }

    // Check participant limit
    const maxParticipants = challenge.maxParticipants;
    const currentCount = challenge.participants.length;
    if (currentCount + usernames.length > maxParticipants) {
      throw new BadRequestException(
        `Cannot invite ${usernames.length} users. Max participants: ${maxParticipants}, current: ${currentCount}`,
      );
    }

    // Find users by usernames
    const users: { id: string; username: string }[] = [];
    for (const username of usernames) {
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        throw new NotFoundException(`User "${username}" not found`);
      }
      users.push(user);
    }

    // Filter out users who are already participants
    const existingUserIds = new Set(challenge.participants.map((p) => p.userId));
    const newUsers = users.filter((u) => !existingUserIds.has(u.id));

    if (newUsers.length === 0) {
      throw new BadRequestException('All specified users are already participants');
    }

    // Create participant entries
    const participants = newUsers.map((u) =>
      this.challengesCommandRepository.createParticipant({
        challengeId: challenge.id,
        userId: u.id,
        status: ChallengeParticipantStatus.INVITED,
      }),
    );

    return this.challengesCommandRepository.saveParticipants(participants);
  }

  /**
   * Find public challenges the user hasn't joined yet.
   */
  async findPublicChallenges(userId: string): Promise<Challenge[]> {
    const today = this.getTodayDate();
    return this.challengesQueryRepository.findPublicChallenges(userId, today);
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
