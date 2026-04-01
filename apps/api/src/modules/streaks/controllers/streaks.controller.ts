import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { StreaksService } from '../services/streaks.service';
import { ApiGetStreaks } from '../swagger/get-streaks.swagger';
import { ApiRecoverStreak } from '../swagger/recover-streak.swagger';

@ApiTags('Streaks')
@Controller('streaks')
@UseGuards(JwtAuthGuard)
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  /**
   * GET /streaks — Get current streak, best streak, shield status
   */
  @Get()
  @ApiGetStreaks()
  async getStreak(@CurrentUser() user: User) {
    return this.streaksService.getStreak(user.id);
  }

  /**
   * POST /streaks/recover — Recover a broken streak by spending XP
   */
  @Post('recover')
  @ApiRecoverStreak()
  async recoverStreak(@CurrentUser() user: User) {
    return this.streaksService.recoverStreak(user.id);
  }
}
