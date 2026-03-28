import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ActivitiesService } from '../services/activities.service';
import { Activity, ActivityCategory } from '../entities/activity.entity';

@ApiTags('Activities')
@ApiBearerAuth('access-token')
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
