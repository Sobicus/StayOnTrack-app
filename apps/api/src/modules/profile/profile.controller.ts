import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'username', description: 'Username of the profile to view' })
  @ApiOperation({ summary: 'Get public profile of a user' })
  @ApiResponse({ status: 200, description: 'Public profile data' })
  @ApiResponse({ status: 403, description: 'Profile is private or friends-only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('username') username: string, @Request() req: any) {
    const requestingUserId = req.user?.id;
    return this.profileService.getPublicProfile(username, requestingUserId);
  }
}
