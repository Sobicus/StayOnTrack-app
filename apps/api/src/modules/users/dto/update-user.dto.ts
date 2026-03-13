import {
  IsString,
  IsOptional,
  IsNumber,
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
  goal?: string;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'ru'])
  locale?: string;
}
