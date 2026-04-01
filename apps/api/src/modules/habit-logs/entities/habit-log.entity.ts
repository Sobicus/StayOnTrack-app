import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Habit } from '../../habits/entities/habit.entity';

export enum HabitLogStatus {
  AVOIDED = 'AVOIDED',
  PARTIAL = 'PARTIAL',
  CONSUMED = 'CONSUMED',
}

@Entity('habit_logs')
@Unique(['habitId', 'date'])
@Index(['habitId'])
@Index(['userId', 'date'])
export class HabitLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  habitId!: string;

  @ManyToOne(() => Habit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habitId' })
  habit!: Habit;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /** Date of the check-in (YYYY-MM-DD, no time component) */
  @Column({ type: 'date' })
  date!: string;

  @Column({
    type: 'enum',
    enum: HabitLogStatus,
  })
  status!: HabitLogStatus;

  /**
   * 0 = fully avoided, 1 = fully consumed.
   * For AVOIDED: portionRatio = 0
   * For PARTIAL: 0 < portionRatio < 1 (e.g. 0.5 = ate half)
   * For CONSUMED: portionRatio = 1
   */
  @Column({ type: 'float', default: 0 })
  portionRatio!: number;

  /** Calories saved = caloriesPerOccurrence * (1 - portionRatio) */
  @Column({ type: 'float', default: 0 })
  savedCalories!: number;

  /** Money saved = pricePerOccurrence * (1 - portionRatio) */
  @Column({ type: 'float', default: 0 })
  savedMoney!: number;

  /** For ACHIEVEMENT habits: how much was completed (e.g., 30 minutes, 8 glasses) */
  @Column({ type: 'float', nullable: true })
  completedAmount!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
