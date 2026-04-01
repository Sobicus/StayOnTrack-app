import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { StatsService } from '../services/stats.service';
import { ApiGetStats } from '../swagger/get-stats.swagger';
import { ApiGetEquivalents } from '../swagger/get-equivalents.swagger';
import { ApiGetLiveStats } from '../swagger/get-live-stats.swagger';
import { ApiGetWeeklyTrends } from '../swagger/get-weekly-trends.swagger';
import { ApiGetStatsByRange } from '../swagger/get-stats-by-range.swagger';
import { ApiGetPatterns } from '../swagger/get-patterns.swagger';
import { ApiGetInsights } from '../swagger/get-insights.swagger';
import { ApiGetReport } from '../swagger/get-report.swagger';

@ApiTags('Stats')
@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /stats — Cumulative user stats
   */
  @Get()
  @ApiGetStats()
  async getStats(@CurrentUser() user: User) {
    return this.statsService.getUserStats(user.id);
  }

  /**
   * GET /stats/equivalents?weight=80 — Effort equivalents
   */
  @Get('equivalents')
  @ApiGetEquivalents()
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
  @ApiGetLiveStats()
  async getLiveStats(@CurrentUser() user: User) {
    return this.statsService.getLiveStats(user);
  }

  /**
   * GET /stats/trends?months=3 — Weekly trend data over N months
   */
  @Get('trends')
  @ApiGetWeeklyTrends()
  async getWeeklyTrends(
    @CurrentUser() user: User,
    @Query('months') months?: string,
  ) {
    const m = months ? parseInt(months, 10) : 3;
    return this.statsService.getWeeklyTrends(user.id, m);
  }

  /**
   * GET /stats/range?start=2026-03-01&end=2026-03-13 — Stats for date range
   */
  @Get('range')
  @ApiGetStatsByRange()
  async getStatsByRange(
    @CurrentUser() user: User,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.statsService.getStatsByDateRange({ userId: user.id, startDate: start, endDate: end });
  }

  /**
   * GET /stats/patterns — Pattern analysis (day-of-week, categories, top habits)
   */
  @Get('patterns')
  @ApiGetPatterns()
  async getPatterns(@CurrentUser() user: User) {
    return this.statsService.getPatterns(user.id);
  }

  /**
   * GET /stats/insights — Human-readable insight strings
   */
  @Get('insights')
  @ApiGetInsights()
  async getInsights(@CurrentUser() user: User) {
    return this.statsService.getInsights(user.id);
  }

  /**
   * GET /stats/report?period=month&date=2026-03 — Monthly/yearly report (Wrapped style)
   */
  @Get('report')
  @ApiGetReport()
  async getReport(
    @CurrentUser() user: User,
    @Query('period') period: 'month' | 'year' = 'month',
    @Query('date') date?: string,
  ) {
    const reportDate =
      date || new Date().toISOString().slice(0, 7); // YYYY-MM
    return this.statsService.getReport({ userId: user.id, period, date: reportDate });
  }
}
