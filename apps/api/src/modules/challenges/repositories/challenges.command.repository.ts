import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from '../entities/challenge.entity';
import {
  ChallengeParticipant,
} from '../entities/challenge-participant.entity';

@Injectable()
export class ChallengesCommandRepository {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeParticipant)
    private readonly participantRepository: Repository<ChallengeParticipant>,
  ) {}

  /**
   * Create a challenge entity (in memory).
   */
  createChallenge(data: Partial<Challenge>): Challenge {
    return this.challengeRepository.create(data);
  }

  /**
   * Save a challenge entity.
   */
  async saveChallenge(challenge: Challenge): Promise<Challenge> {
    return this.challengeRepository.save(challenge);
  }

  /**
   * Create a participant entity (in memory).
   */
  createParticipant(data: Partial<ChallengeParticipant>): ChallengeParticipant {
    return this.participantRepository.create(data);
  }

  /**
   * Save one or more participant entities.
   */
  async saveParticipants(participants: ChallengeParticipant[]): Promise<ChallengeParticipant[]> {
    return this.participantRepository.save(participants);
  }

  /**
   * Save a single participant entity.
   */
  async saveParticipant(participant: ChallengeParticipant): Promise<ChallengeParticipant> {
    return this.participantRepository.save(participant);
  }
}
