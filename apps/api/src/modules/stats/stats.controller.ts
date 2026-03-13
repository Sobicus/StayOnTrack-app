import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@ApiBearerAuth('access-token')
@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /stats — Cumulative user stats
   */
  @Get()
  async getStats(@CurrentUser() user: User) {
    return this.statsService.getUserStats(user.id);
  }

  /**
   * GET /stats/equivalents?weight=80 — Effort equivalents
   */
  @Get('equivalents')
  async getEquivalents(
    @CurrentUser() user: User,
    @Query('weight') weight?: string,
  ) {
    const weightKg = weight ? parseFloat(weight) : user.weightKg || 75;
    return this.statsService.getEffortEquivalents(user.id, weightKg);
  }

  /**
   * GET /stats/live — Live stats for the hero widget (interpolation data)
   */
  @Get('live')
  async getLiveStats(@CurrentUser() user: User) {
    return this.statsService.getLiveStats(user);
  }

  /**
   * GET /stats/range?start=2026-03-01&end=2026-03-13 — Stats for date range
   */
  @Get('range')
  async getStatsByRange(
    @CurrentUser() user: User,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.statsService.getStatsByDateRange(user.id, start, end);
  }
}
