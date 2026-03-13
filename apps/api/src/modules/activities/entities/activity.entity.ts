import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

export enum ActivityCategory {
  CARDIO = 'CARDIO',
  STRENGTH = 'STRENGTH',
  DAILY_LIFE = 'DAILY_LIFE',
  SPORTS = 'SPORTS',
}

export enum ActivityUnit {
  MINUTE = 'MINUTE',
  REP = 'REP',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: ActivityCategory,
  })
  category!: ActivityCategory;

  @Column({
    type: 'enum',
    enum: ActivityUnit,
  })
  unit!: ActivityUnit;

  /** MET value (for MINUTE-based activities) */
  @Column({ type: 'float', nullable: true })
  met!: number | null;

  /** Base calories per unit at base weight */
  @Column({ type: 'float' })
  caloriesPerUnitBase!: number;

  /** Reference weight the base calories were measured at */
  @Column({ type: 'float', default: 75 })
  baseWeightKg!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
