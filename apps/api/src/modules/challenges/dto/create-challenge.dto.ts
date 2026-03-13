import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ChallengeType, ChallengeVisibility } from '@stayontrack/contracts';

export class CreateChallengeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ChallengeType)
  type!: ChallengeType;

  @IsNumber()
  @Min(1)
  targetValue!: number;

  @IsOptional()
  @IsUUID()
  habitId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @MaxLength(30)
  inviteUsername!: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  maxParticipants?: number;

  @IsOptional()
  @IsEnum(ChallengeVisibility)
  visibility?: ChallengeVisibility;
}
