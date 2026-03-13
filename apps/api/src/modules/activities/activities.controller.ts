import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { Activity, ActivityCategory } from './entities/activity.entity';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async findAll(
    @Query('category') category?: ActivityCategory,
  ): Promise<Activity[]> {
    if (category) {
      return this.activitiesService.findByCategory(category);
    }
    return this.activitiesService.findAll();
  }

  /**
   * POST /activities/seed — Seed activities (dev only, idempotent)
   */
  @Post('seed')
  async seed(): Promise<{ seeded: number }> {
    const count = await this.activitiesService.seed();
    return { seeded: count };
  }
}
