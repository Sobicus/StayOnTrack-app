import { Habit } from '../entities/habit.entity';

export class HabitResponseDto {
  id!: string;
  title!: string;
  category!: string;
  habitType!: string;
  caloriesPerOccurrence!: number;
  pricePerOccurrence!: number;
  frequencyType!: string;
  occurrencesPerWeek!: number | null;
  isActive!: boolean;
  sortOrder!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(habit: Habit): HabitResponseDto {
    const dto = new HabitResponseDto();
    dto.id = habit.id;
    dto.title = habit.title;
    dto.category = habit.category;
    dto.habitType = habit.habitType;
    dto.caloriesPerOccurrence = habit.caloriesPerOccurrence;
    dto.pricePerOccurrence = habit.pricePerOccurrence;
    dto.frequencyType = habit.frequencyType;
    dto.occurrencesPerWeek = habit.occurrencesPerWeek;
    dto.isActive = habit.isActive;
    dto.sortOrder = habit.sortOrder;
    dto.createdAt = habit.createdAt;
    dto.updatedAt = habit.updatedAt;
    return dto;
  }
}
