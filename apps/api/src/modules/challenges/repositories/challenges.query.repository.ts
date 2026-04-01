import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Challenge, ChallengeStatus, ChallengeVisibility } from '../entities/challenge.entity';
import {
  ChallengeParticipant,
  ChallengeParticipantStatus,
} from '../entities/challenge-participant.entity';

@Injectable()
export class ChallengesQueryRepository {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeParticipant)
    private readonly participantRepository: Repository<ChallengeParticipant>,
  ) {}

  /**
   * Find participations for a user (challengeId only).
   */
  async findParticipationsByUser(userId: string): Promise<ChallengeParticipant[]> {
    return this.participantRepository.find({
      where: { userId },
      select: ['challengeId'],
    });
  }

  /**
   * Find challenges by IDs with all relations.
   */
  async findByIds(challengeIds: string[]): Promise<Challenge[]> {
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
   * Find a challenge by ID with all relations.
   */
  async findOneWithRelations(challengeId: string): Promise<Challenge> {
    return this.challengeRepository.findOneOrFail({
      where: { id: challengeId },
      relations: ['creator', 'winner', 'participants', 'participants.user'],
    });
  }

  /**
   * Find a challenge by ID (no relations).
   */
  async findById(challengeId: string): Promise<Challenge | null> {
    return this.challengeRepository.findOne({
      where: { id: challengeId },
    });
  }

  /**
   * Find a challenge by invite code with participants.
   */
  async findByInviteCode(code: string): Promise<Challenge | null> {
    return this.challengeRepository.findOne({
      where: { inviteCode: code },
      relations: ['participants'],
    });
  }

  /**
   * Find a challenge by ID with participants.
   */
  async findByIdWithParticipants(challengeId: string): Promise<Challenge | null> {
    return this.challengeRepository.findOne({
      where: { id: challengeId },
      relations: ['participants'],
    });
  }

  /**
   * Find a participant by challengeId, userId, and status.
   */
  async findParticipant(
    challengeId: string,
    userId: string,
    status: ChallengeParticipantStatus,
  ): Promise<ChallengeParticipant | null> {
    return this.participantRepository.findOne({
      where: { challengeId, userId, status },
    });
  }

  /**
   * Find pending invitations for a user.
   */
  async findPendingInvitations(userId: string): Promise<Challenge[]> {
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
   * Find public challenges the user hasn't joined yet.
   */
  async findPublicChallenges(userId: string, today: string): Promise<Challenge[]> {
    // Get IDs of challenges the user is already participating in
    const participations = await this.participantRepository.find({
      where: { userId },
      select: ['challengeId'],
    });
    const joinedIds = participations.map((p) => p.challengeId);

    const qb = this.challengeRepository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.creator', 'creator')
      .leftJoinAndSelect('challenge.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('challenge.visibility = :visibility', {
        visibility: ChallengeVisibility.PUBLIC,
      })
      .andWhere('challenge.status = :status', {
        status: ChallengeStatus.ACTIVE,
      })
      .andWhere('challenge.endDate > :today', { today })
      .orderBy('challenge.createdAt', 'DESC')
      .take(20);

    if (joinedIds.length > 0) {
      qb.andWhere('challenge.id NOT IN (:...joinedIds)', { joinedIds });
    }

    return qb.getMany();
  }

  /**
   * Count accepted participations for a user.
   */
  async countAcceptedParticipations(userId: string): Promise<number> {
    return this.participantRepository.count({
      where: { userId, status: ChallengeParticipantStatus.ACCEPTED },
    });
  }

  /**
   * Count completed challenges where user is the winner.
   */
  async countWins(userId: string): Promise<number> {
    return this.challengeRepository.count({
      where: { winnerId: userId, status: ChallengeStatus.COMPLETED },
    });
  }

  /**
   * Count AVOIDED habit logs for a user/habit in a date range (raw query).
   */
  async countAvoidedHabitLogs(
    userId: string,
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const result = await this.challengeRepository.manager.query(
      `SELECT COUNT(*) as count
       FROM habit_logs
       WHERE "userId" = $1
         AND "habitId" = $2
         AND date >= $3
         AND date <= $4
         AND status = 'AVOIDED'`,
      [userId, habitId, startDate, endDate],
    );
    return parseInt(result[0]?.count) || 0;
  }
}
