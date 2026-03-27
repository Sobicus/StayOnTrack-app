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

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId!: string | null;

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

  /** Monthly savings goal amount in user's currency. Null means no goal set. */
  @Column({ type: 'float', nullable: true })
  monthlySavingsGoal!: number | null;

  /** Day the week starts on: 'monday' or 'sunday'. Default 'monday'. */
  @Column({ type: 'varchar', length: 10, default: 'monday' })
  weekStartDay!: string;

  /** Unit system: 'metric' or 'imperial'. Default 'metric'. */
  @Column({ type: 'varchar', length: 10, default: 'metric' })
  unitSystem!: string;

  /** Whether the user has completed the onboarding wizard. */
  @Column({ type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  /** Whether the user wants daily reminder emails. */
  @Column({ type: 'boolean', default: true })
  emailReminders!: boolean;

  /** Hour (0-23) when daily reminder should be sent. Default 20 (8 PM). */
  @Column({ type: 'int', default: 20 })
  reminderHour!: number;

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

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  emailVerificationCode!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationSentAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  totalXp!: number;

  @Column({ type: 'date', nullable: true })
  lastShieldReplenishDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
