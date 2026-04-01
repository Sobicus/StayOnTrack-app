import {
  Controller,
  Get,
  Post,
  Patch,
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
import { FriendsService } from '../services/friends.service';
import { SendFriendRequestDto } from '../dto/send-friend-request.dto';
import {
  FriendRequestResponseDto,
  FriendResponseDto,
  LeaderboardEntryDto,
} from '../dto/friend-response.dto';
import { ApiSendRequest } from '../swagger/send-request.swagger';
import { ApiGetIncoming } from '../swagger/get-incoming.swagger';
import { ApiGetOutgoing } from '../swagger/get-outgoing.swagger';
import { ApiAcceptRequest } from '../swagger/accept-request.swagger';
import { ApiDeclineRequest } from '../swagger/decline-request.swagger';
import { ApiGetFriends } from '../swagger/get-friends.swagger';
import { ApiRemoveFriend } from '../swagger/remove-friend.swagger';
import { ApiGetLeaderboard } from '../swagger/get-leaderboard.swagger';

@ApiTags('Friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * POST /friends/requests — Send a friend request by username
   */
  @Post('requests')
  @ApiSendRequest()
  async sendRequest(
    @CurrentUser() user: User,
    @Body() dto: SendFriendRequestDto,
  ): Promise<FriendRequestResponseDto> {
    const request = await this.friendsService.sendRequest(user.id, dto.username);
    return FriendRequestResponseDto.fromEntity(request);
  }

  /**
   * GET /friends/requests/incoming — Get incoming friend requests
   */
  @Get('requests/incoming')
  @ApiGetIncoming()
  async getIncoming(
    @CurrentUser() user: User,
  ): Promise<FriendRequestResponseDto[]> {
    const requests = await this.friendsService.getIncomingRequests(user.id);
    return requests.map(FriendRequestResponseDto.fromEntity);
  }

  /**
   * GET /friends/requests/outgoing — Get outgoing friend requests
   */
  @Get('requests/outgoing')
  @ApiGetOutgoing()
  async getOutgoing(
    @CurrentUser() user: User,
  ): Promise<FriendRequestResponseDto[]> {
    const requests = await this.friendsService.getOutgoingRequests(user.id);
    return requests.map(FriendRequestResponseDto.fromEntity);
  }

  /**
   * PATCH /friends/requests/:id/accept — Accept a friend request
   */
  @Patch('requests/:id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAcceptRequest()
  async acceptRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.friendsService.acceptRequest(id, user.id);
  }

  /**
   * PATCH /friends/requests/:id/decline — Decline a friend request
   */
  @Patch('requests/:id/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeclineRequest()
  async declineRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.friendsService.declineRequest(id, user.id);
  }

  /**
   * GET /friends — List all friends
   */
  @Get()
  @ApiGetFriends()
  async getFriends(
    @CurrentUser() user: User,
  ): Promise<FriendResponseDto[]> {
    const friendships = await this.friendsService.getFriends(user.id);
    return friendships.map(FriendResponseDto.fromEntity);
  }

  /**
   * DELETE /friends/:friendId — Remove a friend
   */
  @Delete(':friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveFriend()
  async removeFriend(
    @CurrentUser() user: User,
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ): Promise<void> {
    await this.friendsService.removeFriend(user.id, friendId);
  }

  /**
   * GET /friends/leaderboard?metric=savedCalories
   * Get friend leaderboard
   */
  @Get('leaderboard')
  @ApiGetLeaderboard()
  async getLeaderboard(
    @CurrentUser() user: User,
    @Query('metric') metric?: string,
  ): Promise<LeaderboardEntryDto[]> {
    return this.friendsService.getFriendsLeaderboard(user.id, metric);
  }
}
