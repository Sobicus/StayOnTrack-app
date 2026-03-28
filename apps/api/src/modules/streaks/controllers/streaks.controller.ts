import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { StreaksService } from '../services/streaks.service';

@ApiTags('Streaks')
@ApiBearerAuth('access-token')
@Controller('streaks')
@UseGuards(JwtAuthGuard)
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  /**
   * GET /streaks — Get current streak, best streak, shield status
   */
  @Get()
  async getStreak(@CurrentUser() user: User) {
    return this.streaksService.getStreak(user.id);
  }

  /**
   * POST /streaks/recover — Recover a broken streak by spending XP
   */
  @Post('recover')
  async recoverStreak(@CurrentUser() user: User) {
    return this.streaksService.recoverStreak(user.id);
  }
}
