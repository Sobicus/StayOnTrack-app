import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiRemoveFriend() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a friend' }),
    ApiParam({ name: 'friendId', description: 'Friend user UUID' }),
    ApiResponse({ status: 204, description: 'Friend removed' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Friendship not found' }),
  );
}
