import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Challenge } from './challenge.entity';

export { ChallengeParticipantStatus } from '@stayontrack/contracts';
import { ChallengeParticipantStatus } from '@stayontrack/contracts';

@Entity('challenge_participants')
@Unique(['challengeId', 'userId'])
export class ChallengeParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  challengeId!: string;

  @ManyToOne(() => Challenge, (c) => c.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  challenge!: Challenge;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ChallengeParticipantStatus,
    default: ChallengeParticipantStatus.INVITED,
  })
  status!: ChallengeParticipantStatus;

  @Column({ type: 'float', default: 0 })
  currentValue!: number;

  @CreateDateColumn()
  joinedAt!: Date;
}
