import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { HabitLogsService } from '../services/habit-logs.service';
import { CreateHabitLogDto } from '../dto/create-habit-log.dto';
import { BatchCheckinDto } from '../dto/batch-checkin.dto';
import { HabitLogResponseDto, DaySummaryDto } from '../dto/habit-log-response.dto';
import { getTodayInTimezone } from '../../../common/utils/date.utils';
import { ApiCreateLog } from '../swagger/create-log.swagger';
import { ApiBatchCheckin } from '../swagger/batch-checkin.swagger';
import { ApiGetFrequencyStatus } from '../swagger/get-frequency-status.swagger';
import { ApiGetDaySummary } from '../swagger/get-day-summary.swagger';
import { ApiGetByDateRange } from '../swagger/get-by-date-range.swagger';
import { ApiGetByHabit } from '../swagger/get-by-habit.swagger';
import { ApiDeleteLog } from '../swagger/delete-log.swagger';

@ApiTags('Check-ins')
@Controller('habit-logs')
@UseGuards(JwtAuthGuard)
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) {}

  /**
   * POST /habit-logs — Single habit check-in
   */
  @Post()
  @ApiCreateLog()
  async createLog(
    @CurrentUser() user: User,
    @Body() dto: CreateHabitLogDto,
  ): Promise<HabitLogResponseDto> {
    const { log, xpEarned, levelUp } = await this.habitLogsService.createLog({ userId: user.id, dto, timezone: user.timezone });
    return HabitLogResponseDto.fromEntity(log, { xpEarned, levelUp });
  }

  /**
   * POST /habit-logs/batch — Batch check-in (all habits at once)
   * Primary flow: user swipes through all habits → submit
   */
  @Post('batch')
  @ApiBatchCheckin()
  async batchCheckin(
    @CurrentUser() user: User,
    @Body() dto: BatchCheckinDto,
  ): Promise<HabitLogResponseDto[]> {
    const results = await this.habitLogsService.batchCheckin({ userId: user.id, dto, timezone: user.timezone });
    return results.map((r) => HabitLogResponseDto.fromEntity(r.log, { xpEarned: r.xpEarned, levelUp: r.levelUp }));
  }

  /**
   * GET /habit-logs/frequency-status?date=2026-03-13
   * Get weekly frequency status for all active habits.
   * Returns used/limit/remaining for each habit.
   */
  @Get('frequency-status')
  @ApiGetFrequencyStatus()
  async getFrequencyStatus(
    @CurrentUser() user: User,
    @Query('date') date?: string,
  ) {
    return this.habitLogsService.getFrequencyStatus({ userId: user.id, date, timezone: user.timezone });
  }

  /**
   * GET /habit-logs/day?date=2026-03-13
   * Get summary for a specific day (or today)
   */
  @Get('day')
  @ApiGetDaySummary()
  async getDaySummary(
    @CurrentUser() user: User,
    @Query('date') date?: string,
  ): Promise<DaySummaryDto> {
    const targetDate = date || getTodayInTimezone(user.timezone);
    return this.habitLogsService.getDaySummary(user.id, targetDate);
  }

  /**
   * GET /habit-logs/range?start=2026-03-01&end=2026-03-13
   * Get logs for a date range (calendar / history view)
   */
  @Get('range')
  @ApiGetByDateRange()
  async getByDateRange(
    @CurrentUser() user: User,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<HabitLogResponseDto[]> {
    const logs = await this.habitLogsService.getLogsByDateRange({
      userId: user.id,
      startDate: start,
      endDate: end,
    });
    return logs.map((log) => HabitLogResponseDto.fromEntity(log));
  }

  /**
   * GET /habit-logs/habit/:habitId?start=...&end=...
   * Get logs for a specific habit
   */
  @Get('habit/:habitId')
  @ApiGetByHabit()
  async getByHabit(
    @CurrentUser() user: User,
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<HabitLogResponseDto[]> {
    const logs = await this.habitLogsService.getLogsByHabit(
      user.id,
      habitId,
      start,
      end,
    );
    return logs.map((log) => HabitLogResponseDto.fromEntity(log));
  }

  /**
   * DELETE /habit-logs/:id — Undo a check-in
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteLog()
  async deleteLog(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.habitLogsService.deleteLog(id, user.id);
  }
}
