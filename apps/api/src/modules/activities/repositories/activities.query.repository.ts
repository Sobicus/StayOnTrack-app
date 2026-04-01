import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityCategory } from '../entities/activity.entity';

@Injectable()
export class ActivitiesQueryRepository {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  async findAll(): Promise<Activity[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findByCategory(category: ActivityCategory): Promise<Activity[]> {
    return this.repo.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Activity | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
