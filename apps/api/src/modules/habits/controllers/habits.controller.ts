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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { HabitsService } from '../services/habits.service';
import { CreateHabitDto } from '../dto/create-habit.dto';
import { UpdateHabitDto } from '../dto/update-habit.dto';
import { HabitResponseDto } from '../dto/habit-response.dto';

@ApiTags('Habits')
@ApiBearerAuth('access-token')
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get('templates')
  async getTemplates() {
    return this.habitsService.getTemplates();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateHabitDto,
  ): Promise<HabitResponseDto> {
    const habit = await this.habitsService.create(user.id, dto);
    return HabitResponseDto.fromEntity(habit);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
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
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HabitResponseDto> {
    const habit = await this.habitsService.findOneByUser(id, user.id);
    return HabitResponseDto.fromEntity(habit);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
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
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.habitsService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder/bulk')
  async reorder(
    @CurrentUser() user: User,
    @Body('habitIds') habitIds: string[],
  ): Promise<HabitResponseDto[]> {
    const habits = await this.habitsService.reorder(user.id, habitIds);
    return habits.map(HabitResponseDto.fromEntity);
  }
}
