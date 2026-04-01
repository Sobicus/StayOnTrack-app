import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiInviteUsers() {
  return applyDecorators(
    ApiOperation({ summary: 'Invite multiple users to a challenge' }),
    ApiParam({ name: 'id', description: 'Challenge UUID' }),
    ApiResponse({ status: 201, description: 'Users invited' }),
    ApiResponse({ status: 400, description: 'Invalid usernames' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Challenge not found' }),
  );
}
