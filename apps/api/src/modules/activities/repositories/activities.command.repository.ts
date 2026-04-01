import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';

@Injectable()
export class ActivitiesCommandRepository {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  async saveMany(activities: Partial<Activity>[]): Promise<Activity[]> {
    return this.repo.save(activities);
  }
}
