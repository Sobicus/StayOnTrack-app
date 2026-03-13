import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum ProfileVisibility {
  PRIVATE = 'PRIVATE',
  FRIENDS = 'FRIENDS',
  PUBLIC = 'PUBLIC',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  passwordHash!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'float', nullable: true })
  weightKg!: number | null;

  @Column({ type: 'float', nullable: true })
  heightCm!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  goal!: string | null;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.PRIVATE,
  })
  visibility!: ProfileVisibility;

  @Column({ type: 'varchar', length: 5, default: 'en' })
  locale!: string;

  @Column({ type: 'int', default: 1 })
  streakShieldsRemaining!: number;

  /** Hour when "today" ends (0-23). Default 0 = midnight. E.g., 21 means day ends at 9 PM. */
  @Column({ type: 'int', default: 0 })
  dayEndHour!: number;

  /** IANA timezone identifier (e.g. 'Europe/Warsaw', 'America/New_York'). Default 'UTC'. */
  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone!: string;

  /** Currency symbol for money display. Default EUR (€). */
  @Column({ type: 'varchar', length: 5, default: 'EUR' })
  currency!: string;

  /** Day the week starts on: 'monday' or 'sunday'. Default 'monday'. */
  @Column({ type: 'varchar', length: 10, default: 'monday' })
  weekStartDay!: string;

  /** Whether the user has completed the onboarding wizard. */
  @Column({ type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  /** Hashed refresh token (null when logged out). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  refreshTokenHash!: string | null;

  /** Hashed password reset token + expiry. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  passwordResetTokenHash!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires!: Date | null;

  @Column({ type: 'date', nullable: true })
  lastShieldReplenishDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
