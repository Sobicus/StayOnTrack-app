import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { HabitCategory, HabitFrequencyType, HabitType } from '../entities/habit.entity';

export class CreateHabitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  emoji?: string;

  @IsEnum(HabitCategory)
  @IsOptional()
  category?: HabitCategory;

  @IsEnum(HabitType)
  @IsOptional()
  habitType?: HabitType;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  targetUnit?: string;

  @IsNumber()
  @Min(0)
  @Max(50000)
  @IsOptional()
  caloriesPerOccurrence?: number;

  @IsNumber()
  @Min(0)
  @Max(100000)
  @IsOptional()
  pricePerOccurrence?: number;

  @IsEnum(HabitFrequencyType)
  @IsOptional()
  frequencyType?: HabitFrequencyType;

  @IsInt()
  @Min(1)
  @Max(7)
  @IsOptional()
  occurrencesPerWeek?: number;
}
