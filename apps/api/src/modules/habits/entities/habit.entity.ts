import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum HabitCategory {
  SWEETS = 'SWEETS',
  ALCOHOL = 'ALCOHOL',
  FASTFOOD = 'FASTFOOD',
  SNACKS = 'SNACKS',
  DRINKS = 'DRINKS',
  CUSTOM = 'CUSTOM',
}

export enum HabitType {
  AVOIDANCE = 'AVOIDANCE',
  ACHIEVEMENT = 'ACHIEVEMENT',
}

export enum HabitFrequencyType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
}

@Entity('habits')
@Index(['userId'])
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 10, default: '🚫' })
  emoji!: string;

  @Column({
    type: 'enum',
    enum: HabitCategory,
    default: HabitCategory.CUSTOM,
  })
  category!: HabitCategory;

  @Column({
    type: 'enum',
    enum: HabitType,
    default: HabitType.AVOIDANCE,
  })
  habitType!: HabitType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  targetUnit!: string | null;

  /** Daily goal for ACHIEVEMENT habits (e.g. 30 minutes, 5 km). null = no target set. */
  @Column({ type: 'float', nullable: true })
  dailyTarget!: number | null;

  @Column({ type: 'float', default: 0 })
  caloriesPerOccurrence!: number;

  @Column({ type: 'float', default: 0 })
  pricePerOccurrence!: number;

  @Column({
    type: 'enum',
    enum: HabitFrequencyType,
    default: HabitFrequencyType.DAILY,
  })
  frequencyType!: HabitFrequencyType;

  @Column({ type: 'int', nullable: true })
  occurrencesPerWeek!: number | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
