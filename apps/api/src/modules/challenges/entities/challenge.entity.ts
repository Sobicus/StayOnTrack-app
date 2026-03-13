import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChallengeParticipant } from './challenge-participant.entity';

export { ChallengeType, ChallengeStatus, ChallengeVisibility } from '@stayontrack/contracts';
import { ChallengeType, ChallengeStatus, ChallengeVisibility } from '@stayontrack/contracts';

@Entity('challenges')
@Index(['status', 'visibility'])
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  creatorUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorUserId' })
  creator!: User;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ChallengeType })
  type!: ChallengeType;

  @Column({ type: 'float' })
  targetValue!: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  habitId!: string | null;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column({
    type: 'enum',
    enum: ChallengeStatus,
    default: ChallengeStatus.ACTIVE,
  })
  status!: ChallengeStatus;

  @Column({ type: 'uuid', nullable: true })
  winnerId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winnerId' })
  winner!: User | null;

  @Column({ type: 'int', default: 2 })
  maxParticipants!: number;

  @Column({ type: 'varchar', length: 8, nullable: true, unique: true })
  inviteCode!: string | null;

  @Column({
    type: 'enum',
    enum: ChallengeVisibility,
    default: ChallengeVisibility.PRIVATE,
  })
  visibility!: ChallengeVisibility;

  @OneToMany(() => ChallengeParticipant, (p) => p.challenge, { cascade: true })
  participants!: ChallengeParticipant[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
