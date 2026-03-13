import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('retention')
  async getRetention(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return this.analyticsService.getRetentionCohorts(startDate, endDate);
  }

  @Get('dau')
  async getDailyActiveUsers(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const results: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const count = await this.analyticsService.getDailyActiveUsers(date);
      results.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return results;
  }

  @Get('funnel')
  async getFunnel() {
    return this.analyticsService.getUserFunnel();
  }

  @Get('events/:type')
  async getEventCounts(
    @Param('type') type: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.analyticsService.getEventCounts(type, days);
  }
}
