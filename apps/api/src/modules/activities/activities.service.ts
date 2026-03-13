import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityCategory, ActivityUnit } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async findAll(): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findByCategory(category: ActivityCategory): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Activity | null> {
    return this.activityRepository.findOne({ where: { slug } });
  }

  /**
   * Seed the activities table with predefined activities.
   * Only inserts if the table is empty.
   */
  async seed(): Promise<number> {
    const count = await this.activityRepository.count();
    if (count > 0) return 0;

    const activities = this.getSeedData();
    await this.activityRepository.save(activities);
    return activities.length;
  }

  private getSeedData(): Partial<Activity>[] {
    return [
      // CARDIO — MET-based (minutes)
      { slug: 'running-moderate', name: 'Running (moderate)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 8.0, caloriesPerUnitBase: 9.33, baseWeightKg: 75 },
      { slug: 'running-fast', name: 'Running (fast)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 11.0, caloriesPerUnitBase: 12.83, baseWeightKg: 75 },
      { slug: 'walking-brisk', name: 'Walking (brisk)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 4.3, caloriesPerUnitBase: 5.02, baseWeightKg: 75 },
      { slug: 'walking-casual', name: 'Walking (casual)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 2.8, caloriesPerUnitBase: 3.27, baseWeightKg: 75 },
      { slug: 'cycling-moderate', name: 'Cycling (moderate)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 6.8, caloriesPerUnitBase: 7.93, baseWeightKg: 75 },
      { slug: 'cycling-vigorous', name: 'Cycling (vigorous)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 10.0, caloriesPerUnitBase: 11.67, baseWeightKg: 75 },
      { slug: 'swimming-moderate', name: 'Swimming (moderate)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 5.8, caloriesPerUnitBase: 6.77, baseWeightKg: 75 },
      { slug: 'swimming-vigorous', name: 'Swimming (vigorous)', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 9.8, caloriesPerUnitBase: 11.43, baseWeightKg: 75 },
      { slug: 'jump-rope', name: 'Jump rope', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 11.0, caloriesPerUnitBase: 12.83, baseWeightKg: 75 },
      { slug: 'rowing', name: 'Rowing machine', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 7.0, caloriesPerUnitBase: 8.17, baseWeightKg: 75 },
      { slug: 'elliptical', name: 'Elliptical trainer', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 5.0, caloriesPerUnitBase: 5.83, baseWeightKg: 75 },
      { slug: 'stair-climbing', name: 'Stair climbing', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 9.0, caloriesPerUnitBase: 10.5, baseWeightKg: 75 },
      { slug: 'dancing', name: 'Dancing', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 5.5, caloriesPerUnitBase: 6.42, baseWeightKg: 75 },
      { slug: 'hiit', name: 'HIIT workout', category: ActivityCategory.CARDIO, unit: ActivityUnit.MINUTE, met: 12.0, caloriesPerUnitBase: 14.0, baseWeightKg: 75 },

      // STRENGTH — Rep-based
      { slug: 'pushups', name: 'Push-ups', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.36, baseWeightKg: 75 },
      { slug: 'squats', name: 'Squats', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.32, baseWeightKg: 75 },
      { slug: 'burpees', name: 'Burpees', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 1.0, baseWeightKg: 75 },
      { slug: 'lunges', name: 'Lunges', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.3, baseWeightKg: 75 },
      { slug: 'situps', name: 'Sit-ups', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.2, baseWeightKg: 75 },
      { slug: 'pullups', name: 'Pull-ups', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 1.0, baseWeightKg: 75 },
      { slug: 'plank', name: 'Plank (seconds)', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.07, baseWeightKg: 75 },
      { slug: 'jumping-jacks', name: 'Jumping jacks', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.14, baseWeightKg: 75 },
      { slug: 'mountain-climbers', name: 'Mountain climbers', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.5, baseWeightKg: 75 },
      { slug: 'kettlebell-swings', name: 'Kettlebell swings', category: ActivityCategory.STRENGTH, unit: ActivityUnit.REP, met: null, caloriesPerUnitBase: 0.6, baseWeightKg: 75 },

      // SPORTS — MET-based (minutes)
      { slug: 'basketball', name: 'Basketball', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 6.5, caloriesPerUnitBase: 7.58, baseWeightKg: 75 },
      { slug: 'football', name: 'Football / Soccer', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 7.0, caloriesPerUnitBase: 8.17, baseWeightKg: 75 },
      { slug: 'tennis', name: 'Tennis', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 7.3, caloriesPerUnitBase: 8.52, baseWeightKg: 75 },
      { slug: 'volleyball', name: 'Volleyball', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 4.0, caloriesPerUnitBase: 4.67, baseWeightKg: 75 },
      { slug: 'boxing', name: 'Boxing / kickboxing', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 7.8, caloriesPerUnitBase: 9.1, baseWeightKg: 75 },
      { slug: 'martial-arts', name: 'Martial arts', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 10.3, caloriesPerUnitBase: 12.02, baseWeightKg: 75 },
      { slug: 'ice-skating', name: 'Ice skating', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 5.5, caloriesPerUnitBase: 6.42, baseWeightKg: 75 },
      { slug: 'skiing', name: 'Skiing (downhill)', category: ActivityCategory.SPORTS, unit: ActivityUnit.MINUTE, met: 4.3, caloriesPerUnitBase: 5.02, baseWeightKg: 75 },

      // DAILY_LIFE — MET-based (minutes)
      { slug: 'cleaning-house', name: 'Cleaning house', category: ActivityCategory.DAILY_LIFE, unit: ActivityUnit.MINUTE, met: 3.3, caloriesPerUnitBase: 3.85, baseWeightKg: 75 },
      { slug: 'gardening', name: 'Gardening', category: ActivityCategory.DAILY_LIFE, unit: ActivityUnit.MINUTE, met: 3.8, caloriesPerUnitBase: 4.43, baseWeightKg: 75 },
      { slug: 'cooking', name: 'Cooking', category: ActivityCategory.DAILY_LIFE, unit: ActivityUnit.MINUTE, met: 2.0, caloriesPerUnitBase: 2.33, baseWeightKg: 75 },
      { slug: 'playing-with-kids', name: 'Playing with kids', category: ActivityCategory.DAILY_LIFE, unit: ActivityUnit.MINUTE, met: 4.0, caloriesPerUnitBase: 4.67, baseWeightKg: 75 },
      { slug: 'yoga', name: 'Yoga', category: ActivityCategory.DAILY_LIFE, unit: ActivityUnit.MINUTE, met: 2.5, caloriesPerUnitBase: 2.92, baseWeightKg: 75 },
      { slug: 'stretching', name: 'Stretching', category: ActivityCategory.DAILY_LIFE, unit: ActivityUnit.MINUTE, met: 2.3, caloriesPerUnitBase: 2.68, baseWeightKg: 75 },
    ];
  }
}
