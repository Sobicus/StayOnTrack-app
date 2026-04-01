import { HabitLog } from '../entities/habit-log.entity';

export class HabitLogResponseDto {
  id!: string;
  habitId!: string;
  date!: string;
  status!: string;
  portionRatio!: number;
  savedCalories!: number;
  savedMoney!: number;
  completedAmount!: number | null;
  createdAt!: Date;
  xpEarned?: number;
  levelUp?: boolean;

  static fromEntity(
    log: HabitLog,
    xpInfo?: { xpEarned: number; levelUp: boolean },
  ): HabitLogResponseDto {
    const dto = new HabitLogResponseDto();
    dto.id = log.id;
    dto.habitId = log.habitId;
    dto.date = log.date;
    dto.status = log.status;
    dto.portionRatio = log.portionRatio;
    dto.savedCalories = log.savedCalories;
    dto.savedMoney = log.savedMoney;
    dto.completedAmount = log.completedAmount ?? null;
    dto.createdAt = log.createdAt;
    if (xpInfo) {
      dto.xpEarned = xpInfo.xpEarned;
      dto.levelUp = xpInfo.levelUp;
    }
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
