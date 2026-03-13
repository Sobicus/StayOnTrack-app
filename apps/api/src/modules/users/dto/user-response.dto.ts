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
    dto.createdAt = user.createdAt;
    return dto;
  }
}
