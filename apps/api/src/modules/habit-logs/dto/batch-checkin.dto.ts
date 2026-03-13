import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { CreateHabitLogDto } from './create-habit-log.dto';

/**
 * Batch check-in: submit multiple habit statuses at once.
 * This is the primary check-in flow — user taps through all habits in one go.
 */
export class BatchCheckinDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateHabitLogDto)
  logs!: CreateHabitLogDto[];

  /**
   * Date for all logs in this batch. Defaults to today.
   * Individual log dates override this if provided.
   */
  @IsDateString()
  @IsOptional()
  date?: string;
}
