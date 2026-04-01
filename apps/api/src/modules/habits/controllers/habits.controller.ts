import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { HabitsService } from '../services/habits.service';
import { CreateHabitDto } from '../dto/create-habit.dto';
import { UpdateHabitDto } from '../dto/update-habit.dto';
import { HabitResponseDto } from '../dto/habit-response.dto';
import { ApiGetHabitTemplates } from '../swagger/get-templates.swagger';
import { ApiCreateHabit } from '../swagger/create-habit.swagger';
import { ApiGetHabits } from '../swagger/get-habits.swagger';
import { ApiGetHabit } from '../swagger/get-habit.swagger';
import { ApiUpdateHabit } from '../swagger/update-habit.swagger';
import { ApiDeleteHabit } from '../swagger/delete-habit.swagger';
import { ApiReorderHabits } from '../swagger/reorder-habits.swagger';

@ApiTags('Habits')
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get('templates')
  @ApiGetHabitTemplates()
  async getTemplates() {
    return this.habitsService.getTemplates();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiCreateHabit()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateHabitDto,
  ): Promise<HabitResponseDto> {
    const habit = await this.habitsService.create(user.id, dto);
    return HabitResponseDto.fromEntity(habit);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiGetHabits()
  async findAll(
    @CurrentUser() user: User,
    @Query('active') active?: string,
  ): Promise<HabitResponseDto[]> {
    const habits =
      active === 'true'
        ? await this.habitsService.findActiveByUser(user.id)
        : await this.habitsService.findAllByUser(user.id);
    return habits.map(HabitResponseDto.fromEntity);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiGetHabit()
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HabitResponseDto> {
    const habit = await this.habitsService.findOneByUser(id, user.id);
    return HabitResponseDto.fromEntity(habit);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiUpdateHabit()
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHabitDto,
  ): Promise<HabitResponseDto> {
    const habit = await this.habitsService.update(id, user.id, dto);
    return HabitResponseDto.fromEntity(habit);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteHabit()
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.habitsService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder/bulk')
  @ApiReorderHabits()
  async reorder(
    @CurrentUser() user: User,
    @Body('habitIds') habitIds: string[],
  ): Promise<HabitResponseDto[]> {
    const habits = await this.habitsService.reorder(user.id, habitIds);
    return habits.map(HabitResponseDto.fromEntity);
  }
}
