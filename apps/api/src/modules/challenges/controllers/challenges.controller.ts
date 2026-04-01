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
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ChallengesService } from '../services/challenges.service';
import { CreateChallengeDto } from '../dto/create-challenge.dto';
import { JoinChallengeDto } from '../dto/join-challenge.dto';
import { InviteMultipleDto } from '../dto/invite-multiple.dto';
import { ChallengeResponseDto } from '../dto/challenge-response.dto';
import { ApiCreateChallenge } from '../swagger/create-challenge.swagger';
import { ApiGetChallenges } from '../swagger/get-challenges.swagger';
import { ApiJoinChallenge } from '../swagger/join-challenge.swagger';
import { ApiBrowsePublic } from '../swagger/browse-public.swagger';
import { ApiGetInvitations } from '../swagger/get-invitations.swagger';
import { ApiGetChallenge } from '../swagger/get-challenge.swagger';
import { ApiAcceptChallenge } from '../swagger/accept-challenge.swagger';
import { ApiDeclineChallenge } from '../swagger/decline-challenge.swagger';
import { ApiCancelChallenge } from '../swagger/cancel-challenge.swagger';
import { ApiInviteUsers } from '../swagger/invite-users.swagger';

@ApiTags('Challenges')
@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  /**
   * POST /challenges — Create a new challenge and invite a friend
   */
  @Post()
  @ApiCreateChallenge()
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
  @ApiGetChallenges()
  async findAll(
    @CurrentUser() user: User,
  ): Promise<ChallengeResponseDto[]> {
    const challenges = await this.challengesService.findAllByUser(user.id);
    return challenges.map(ChallengeResponseDto.fromEntity);
  }

  /**
   * POST /challenges/join — Join a challenge by invite code
   */
  @Post('join')
  @ApiJoinChallenge()
  async joinByCode(
    @CurrentUser() user: User,
    @Body() dto: JoinChallengeDto,
  ): Promise<ChallengeResponseDto> {
    const challenge = await this.challengesService.joinByCode(user.id, dto.code);
    return ChallengeResponseDto.fromEntity(challenge);
  }

  /**
   * GET /challenges/browse — Browse public challenges
   */
  @Get('browse')
  @ApiBrowsePublic()
  async browse(
    @CurrentUser() user: User,
  ): Promise<ChallengeResponseDto[]> {
    const challenges = await this.challengesService.findPublicChallenges(user.id);
    return challenges.map(ChallengeResponseDto.fromEntity);
  }

  /**
   * GET /challenges/invitations — Get pending challenge invitations
   */
  @Get('invitations')
  @ApiGetInvitations()
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
  @ApiGetChallenge()
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
  @ApiAcceptChallenge()
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
  @ApiDeclineChallenge()
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
  @ApiCancelChallenge()
  async cancel(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.challengesService.cancelChallenge(id, user.id);
  }

  /**
   * POST /challenges/:id/invite — Invite multiple users to a challenge
   */
  @Post(':id/invite')
  @ApiInviteUsers()
  async inviteMultiple(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InviteMultipleDto,
  ) {
    const participants = await this.challengesService.inviteMultiple({
      challengeId: id,
      creatorUserId: user.id,
      usernames: dto.usernames,
    });
    return { added: participants.length };
  }
}
