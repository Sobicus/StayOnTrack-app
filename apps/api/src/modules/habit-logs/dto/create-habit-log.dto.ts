import {
  IsUUID,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { HabitLogStatus } from '../entities/habit-log.entity';

export class CreateHabitLogDto {
  @IsUUID()
  habitId!: string;

  @IsEnum(HabitLogStatus)
  status!: HabitLogStatus;

  /**
   * How much was consumed (0 = fully avoided, 1 = fully consumed).
   * Required for PARTIAL status.
   * Auto-set to 0 for AVOIDED, 1 for CONSUMED if not provided.
   */
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  portionRatio?: number;

  /**
   * Date in YYYY-MM-DD format. Defaults to today if not provided.
   */
  @IsDateString()
  @IsOptional()
  date?: string;

  /**
   * For ACHIEVEMENT habits: how much was completed (e.g., 30 minutes, 8 glasses).
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  completedAmount?: number;
}
