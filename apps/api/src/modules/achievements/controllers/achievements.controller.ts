import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { AchievementsService } from '../services/achievements.service';
import { ApiGetAchievements } from '../swagger/get-achievements.swagger';

@ApiTags('Achievements')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @ApiGetAchievements()
  async getAchievements(@CurrentUser() user: User) {
    return this.achievementsService.getUserAchievements(user.id);
  }
}
