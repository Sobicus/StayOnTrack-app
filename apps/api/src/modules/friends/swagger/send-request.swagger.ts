import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiSendRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Send a friend request by username' }),
    ApiResponse({ status: 201, description: 'Friend request sent' }),
    ApiResponse({ status: 400, description: 'User not found or already friends' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
