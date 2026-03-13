import { Challenge } from '../entities/challenge.entity';
import { ChallengeParticipant } from '../entities/challenge-participant.entity';

export class ChallengeParticipantDto {
  id!: string;
  userId!: string;
  username!: string;
  avatarUrl!: string | null;
  status!: string;
  currentValue!: number;
  joinedAt!: Date;

  static fromEntity(p: ChallengeParticipant): ChallengeParticipantDto {
    const dto = new ChallengeParticipantDto();
    dto.id = p.id;
    dto.userId = p.userId;
    dto.username = p.user?.username || '';
    dto.avatarUrl = p.user?.avatarUrl || null;
    dto.status = p.status;
    dto.currentValue = p.currentValue;
    dto.joinedAt = p.joinedAt;
    return dto;
  }
}

export class ChallengeResponseDto {
  id!: string;
  creatorUserId!: string;
  creatorUsername!: string;
  title!: string;
  description!: string | null;
  type!: string;
  targetValue!: number;
  habitId!: string | null;
  startDate!: string;
  endDate!: string;
  status!: string;
  winnerId!: string | null;
  winnerUsername!: string | null;
  participants!: ChallengeParticipantDto[];
  createdAt!: Date;

  static fromEntity(challenge: Challenge): ChallengeResponseDto {
    const dto = new ChallengeResponseDto();
    dto.id = challenge.id;
    dto.creatorUserId = challenge.creatorUserId;
    dto.creatorUsername = challenge.creator?.username || '';
    dto.title = challenge.title;
    dto.description = challenge.description;
    dto.type = challenge.type;
    dto.targetValue = challenge.targetValue;
    dto.habitId = challenge.habitId;
    dto.startDate = challenge.startDate;
    dto.endDate = challenge.endDate;
    dto.status = challenge.status;
    dto.winnerId = challenge.winnerId;
    dto.winnerUsername = challenge.winner?.username || null;
    dto.participants = (challenge.participants || []).map(
      ChallengeParticipantDto.fromEntity,
    );
    dto.createdAt = challenge.createdAt;
    return dto;
  }
}
