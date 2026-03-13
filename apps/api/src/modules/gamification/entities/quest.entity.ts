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

export enum QuestType {
  LOG_ALL_HABITS = 'log_all_habits',
  AVOID_FULLY_ONE = 'avoid_fully_one',
  CHECK_IN_BEFORE_NOON = 'check_in_before_noon',
  LOG_3_HABITS = 'log_3_habits',
}

@Entity('quests')
@Unique(['userId', 'questType', 'date'])
export class Quest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: QuestType,
  })
  questType!: QuestType;

  /** Date this quest is for (YYYY-MM-DD, no time component) */
  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'int', default: 50 })
  xpReward!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
