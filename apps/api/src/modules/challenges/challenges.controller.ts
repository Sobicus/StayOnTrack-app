import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { ChallengeResponseDto } from './dto/challenge-response.dto';

@ApiTags('Challenges')
@ApiBearerAuth('access-token')
@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  /**
   * POST /challenges — Create a new challenge and invite a friend
   */
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateChallengeDto,
  ): Promise<ChallengeResponseDto> {
    const challenge = await this.challengesService.create(user.id, dto);
    return ChallengeResponseDto.fromEntity(challenge);
  }

  /**
   * GET /challenges — List all challenges for the current user
   */
  @Get()
  async findAll(
    @CurrentUser() user: User,
  ): Promise<ChallengeResponseDto[]> {
    const challenges = await this.challengesService.findAllByUser(user.id);
    return challenges.map(ChallengeResponseDto.fromEntity);
  }

  /**
   * GET /challenges/invitations — Get pending challenge invitations
   */
  @Get('invitations')
  async getInvitations(
    @CurrentUser() user: User,
  ): Promise<ChallengeResponseDto[]> {
    const challenges = await this.challengesService.getPendingInvitations(
      user.id,
    );
    return challenges.map(ChallengeResponseDto.fromEntity);
  }

  /**
   * GET /challenges/:id — Get a single challenge with progress
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChallengeResponseDto> {
    const challenge = await this.challengesService.getProgress(id, user.id);
    return ChallengeResponseDto.fromEntity(challenge);
  }

  /**
   * PATCH /challenges/:id/accept — Accept a challenge invitation
   */
  @Patch(':id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  async accept(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.challengesService.acceptChallenge(id, user.id);
  }

  /**
   * PATCH /challenges/:id/decline — Decline a challenge invitation
   */
  @Patch(':id/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  async decline(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.challengesService.declineChallenge(id, user.id);
  }

  /**
   * PATCH /challenges/:id/cancel — Cancel a challenge (creator only)
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.challengesService.cancelChallenge(id, user.id);
  }
}
