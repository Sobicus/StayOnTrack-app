import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ProfileVisibility } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @IsIn(['en', 'ru'])
  locale?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(23)
  dayEndHour?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @IsIn(['EUR', 'USD', 'GBP', 'PLN', 'UAH', 'RUB'])
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @IsIn(['monday', 'sunday'])
  weekStartDay?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlySavingsGoal?: number;
}
