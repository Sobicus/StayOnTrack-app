import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Challenge, ChallengeStatus } from './entities/challenge.entity';
import {
  ChallengeParticipant,
  ChallengeParticipantStatus,
} from './entities/challenge-participant.entity';
import { ChallengeType } from '@stayontrack/contracts';
import { UsersService } from '../users/users.service';
import { FriendsService } from '../friends/friends.service';
import { StatsService } from '../stats/stats.service';
import { StreaksService } from '../streaks/streaks.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeParticipant)
    private readonly participantRepository: Repository<ChallengeParticipant>,
    private readonly usersService: UsersService,
    private readonly friendsService: FriendsService,
    private readonly statsService: StatsService,
    private readonly streaksService: StreaksService,
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
    const challenge = this.challengeRepository.create({
      creatorUserId: creatorId,
      title: dto.title,
      description: dto.description || null,
      type: dto.type,
      targetValue: dto.targetValue,
      habitId: dto.habitId || null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: ChallengeStatus.ACTIVE,
    });

    const savedChallenge = await this.challengeRepository.save(challenge);

    // Add creator as ACCEPTED participant
    const creatorParticipant = this.participantRepository.create({
      challengeId: savedChallenge.id,
      userId: creatorId,
      status: ChallengeParticipantStatus.ACCEPTED,
    });

    // Add invited user as INVITED participant
    const invitedParticipant = this.participantRepository.create({
      challengeId: savedChallenge.id,
      userId: invitedUser.id,
      status: ChallengeParticipantStatus.INVITED,
    });

    await this.participantRepository.save([
      creatorParticipant,
      invitedParticipant,
    ]);

    return this.findOneWithRelations(savedChallenge.id);
  }

  /**
   * Get all challenges for a user (as creator or participant).
   */
  async findAllByUser(userId: string): Promise<Challenge[]> {
    // Find all challenge IDs where user is a participant
    const participations = await this.participantRepository.find({
      where: { userId },
      select: ['challengeId'],
    });
    const challengeIds = participations.map((p) => p.challengeId);

    if (challengeIds.length === 0) return [];

    return this.challengeRepository.find({
      where: { id: In(challengeIds) },
      relations: [
        'creator',
        'winner',
        'participants',
        'participants.user',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single challenge by ID (with authorization check).
   */
  async findOneByUser(challengeId: string, userId: string): Promise<Challenge> {
    const challenge = await this.findOneWithRelations(challengeId);

    // Check if user is a participant
    const isParticipant = challenge.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this challenge');
    }

    return challenge;
  }

  /**
   * Accept a challenge invitation.
   */
  async acceptChallenge(challengeId: string, userId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: {
        challengeId,
        userId,
        status: ChallengeParticipantStatus.INVITED,
      },
    });

    if (!participant) {
      throw new NotFoundException('Challenge invitation not found');
    }

    participant.status = ChallengeParticipantStatus.ACCEPTED;
    await this.participantRepository.save(participant);
  }

  /**
   * Decline a challenge invitation.
   */
  async declineChallenge(challengeId: string, userId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: {
        challengeId,
        userId,
        status: ChallengeParticipantStatus.INVITED,
      },
    });

    if (!participant) {
      throw new NotFoundException('Challenge invitation not found');
    }

    participant.status = ChallengeParticipantStatus.DECLINED;
    await this.participantRepository.save(participant);
  }

  /**
   * Cancel a challenge (only creator can cancel).
   */
  async cancelChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.creatorUserId !== userId) {
      throw new ForbiddenException('Only the creator can cancel a challenge');
    }

    if (challenge.status === ChallengeStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed challenge');
    }

    challenge.status = ChallengeStatus.CANCELLED;
    await this.challengeRepository.save(challenge);
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
      await this.participantRepository.save(participant);
    }

    // Check if challenge should be completed (end date passed)
    await this.checkAndCompleteChallenge(challenge);

    return this.findOneWithRelations(challengeId);
  }

  /**
   * Get pending invitations for a user.
   */
  async getPendingInvitations(userId: string): Promise<Challenge[]> {
    const invitations = await this.participantRepository.find({
      where: { userId, status: ChallengeParticipantStatus.INVITED },
      select: ['challengeId'],
    });

    const challengeIds = invitations.map((p) => p.challengeId);
    if (challengeIds.length === 0) return [];

    return this.challengeRepository.find({
      where: { id: In(challengeIds), status: ChallengeStatus.ACTIVE },
      relations: ['creator', 'winner', 'participants', 'participants.user'],
      order: { createdAt: 'DESC' },
    });
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
        const stats = await this.statsService.getStatsByDateRange(
          userId,
          challenge.startDate,
          challenge.endDate,
        );
        return stats.totalSavedCalories;
      }

      case ChallengeType.MONEY: {
        const stats = await this.statsService.getStatsByDateRange(
          userId,
          challenge.startDate,
          challenge.endDate,
        );
        return stats.totalSavedMoney;
      }

      case ChallengeType.STREAK: {
        const streak = await this.streaksService.getStreak(userId);
        return streak.currentStreak;
      }

      case ChallengeType.HABIT: {
        // Count days where this specific habit was AVOIDED within date range
        if (!challenge.habitId) return 0;
        const result = await this.challengeRepository.manager.query(
          `SELECT COUNT(*) as count
           FROM habit_logs
           WHERE "userId" = $1
             AND "habitId" = $2
             AND date >= $3
             AND date <= $4
             AND status = 'AVOIDED'`,
          [userId, challenge.habitId, challenge.startDate, challenge.endDate],
        );
        return parseInt(result[0]?.count) || 0;
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
      await this.challengeRepository.save(challenge);
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
    await this.challengeRepository.save(challenge);
  }

  /**
   * Get challenge count for a user.
   */
  async getChallengeCount(userId: string): Promise<number> {
    return this.participantRepository.count({
      where: { userId, status: ChallengeParticipantStatus.ACCEPTED },
    });
  }

  /**
   * Get completed challenge count where user is the winner.
   */
  async getWinCount(userId: string): Promise<number> {
    return this.challengeRepository.count({
      where: { winnerId: userId, status: ChallengeStatus.COMPLETED },
    });
  }

  private findOneWithRelations(challengeId: string): Promise<Challenge> {
    return this.challengeRepository.findOneOrFail({
      where: { id: challengeId },
      relations: ['creator', 'winner', 'participants', 'participants.user'],
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
