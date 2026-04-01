import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetFriends() {
  return applyDecorators(
    ApiOperation({ summary: 'List all friends' }),
    ApiResponse({ status: 200, description: 'Friends list returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
