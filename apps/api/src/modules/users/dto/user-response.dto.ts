import { User } from '../entities/user.entity';

export class UserResponseDto {
  id!: string;
  email!: string;
  username!: string;
  avatarUrl!: string | null;
  weightKg!: number | null;
  heightCm!: number | null;
  goal!: string | null;
  visibility!: string;
  locale!: string;
  streakShieldsRemaining!: number;
  dayEndHour!: number;
  timezone!: string;
  monthlySavingsGoal!: number | null;
  currency!: string;
  weekStartDay!: string;
  unitSystem!: string;
  emailReminders!: boolean;
  reminderHour!: number;
  emailVerified!: boolean;
  totalXp!: number;
  googleId!: string | null;
  createdAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.username = user.username;
    dto.avatarUrl = user.avatarUrl;
    dto.weightKg = user.weightKg;
    dto.heightCm = user.heightCm;
    dto.goal = user.goal;
    dto.visibility = user.visibility;
    dto.locale = user.locale;
    dto.streakShieldsRemaining = user.streakShieldsRemaining;
    dto.dayEndHour = user.dayEndHour;
    dto.timezone = user.timezone;
    dto.currency = user.currency;
    dto.weekStartDay = user.weekStartDay;
    dto.unitSystem = user.unitSystem;
    dto.monthlySavingsGoal = user.monthlySavingsGoal;
    dto.emailReminders = user.emailReminders;
    dto.reminderHour = user.reminderHour;
    dto.emailVerified = user.emailVerified;
    dto.totalXp = user.totalXp;
    dto.googleId = user.googleId ?? null;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
