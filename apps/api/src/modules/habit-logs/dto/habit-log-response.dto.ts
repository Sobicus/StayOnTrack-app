import { HabitLog } from '../entities/habit-log.entity';

export class HabitLogResponseDto {
  id!: string;
  habitId!: string;
  date!: string;
  status!: string;
  portionRatio!: number;
  savedCalories!: number;
  savedMoney!: number;
  createdAt!: Date;

  static fromEntity(log: HabitLog): HabitLogResponseDto {
    const dto = new HabitLogResponseDto();
    dto.id = log.id;
    dto.habitId = log.habitId;
    dto.date = log.date;
    dto.status = log.status;
    dto.portionRatio = log.portionRatio;
    dto.savedCalories = log.savedCalories;
    dto.savedMoney = log.savedMoney;
    dto.createdAt = log.createdAt;
    return dto;
  }
}

export class DaySummaryDto {
  date!: string;
  logs!: HabitLogResponseDto[];
  totalSavedCalories!: number;
  totalSavedMoney!: number;
  allAvoided!: boolean;
  checkedInCount!: number;
  totalActiveHabits!: number;
}
