import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { GamificationService } from '../services/gamification.service';

@ApiTags('Gamification')
@ApiBearerAuth('access-token')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * GET /gamification/level — Get current level info for the authenticated user
   */
  @Get('level')
  @ApiOperation({ summary: 'Get current level info' })
  async getLevel(@CurrentUser() user: User) {
    return this.gamificationService.getLevelInfo(user.id);
  }

  /**
   * GET /gamification/quests — Get today's daily quests with completion status
   */
  @Get('quests')
  @ApiOperation({ summary: "Get today's daily quests" })
  async getDailyQuests(@CurrentUser() user: User) {
    return this.gamificationService.getDailyQuests(user.id);
  }

  /**
   * POST /gamification/quests/check — Check all quests and award XP for completed ones
   */
  @Post('quests/check')
  @ApiOperation({ summary: 'Check and update all daily quests' })
  async checkQuests(@CurrentUser() user: User) {
    return this.gamificationService.checkAllQuests(user.id);
  }
}
