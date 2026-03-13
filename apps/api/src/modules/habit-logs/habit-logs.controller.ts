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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { HabitLogsService } from './habit-logs.service';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { BatchCheckinDto } from './dto/batch-checkin.dto';
import { HabitLogResponseDto, DaySummaryDto } from './dto/habit-log-response.dto';
import { getTodayInTimezone } from '../../common/utils/date.utils';

@ApiTags('Check-ins')
@ApiBearerAuth('access-token')
@Controller('habit-logs')
@UseGuards(JwtAuthGuard)
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) {}

  /**
   * POST /habit-logs — Single habit check-in
   */
  @Post()
  async createLog(
    @CurrentUser() user: User,
    @Body() dto: CreateHabitLogDto,
  ): Promise<HabitLogResponseDto> {
    const log = await this.habitLogsService.createLog(user.id, dto, user.timezone);
    return HabitLogResponseDto.fromEntity(log);
  }

  /**
   * POST /habit-logs/batch — Batch check-in (all habits at once)
   * Primary flow: user swipes through all habits → submit
   */
  @Post('batch')
  async batchCheckin(
    @CurrentUser() user: User,
    @Body() dto: BatchCheckinDto,
  ): Promise<HabitLogResponseDto[]> {
    const logs = await this.habitLogsService.batchCheckin(user.id, dto, user.timezone);
    return logs.map(HabitLogResponseDto.fromEntity);
  }

  /**
   * GET /habit-logs/frequency-status?date=2026-03-13
   * Get weekly frequency status for all active habits.
   * Returns used/limit/remaining for each habit.
   */
  @Get('frequency-status')
  async getFrequencyStatus(
    @CurrentUser() user: User,
    @Query('date') date?: string,
  ) {
    return this.habitLogsService.getFrequencyStatus(user.id, date, user.timezone);
  }

  /**
   * GET /habit-logs/day?date=2026-03-13
   * Get summary for a specific day (or today)
   */
  @Get('day')
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
  async getByDateRange(
    @CurrentUser() user: User,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<HabitLogResponseDto[]> {
    const logs = await this.habitLogsService.getLogsByDateRange(
      user.id,
      start,
      end,
    );
    return logs.map(HabitLogResponseDto.fromEntity);
  }

  /**
   * GET /habit-logs/habit/:habitId?start=...&end=...
   * Get logs for a specific habit
   */
  @Get('habit/:habitId')
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
    return logs.map(HabitLogResponseDto.fromEntity);
  }

  /**
   * DELETE /habit-logs/:id — Undo a check-in
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLog(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.habitLogsService.deleteLog(id, user.id);
  }
}
