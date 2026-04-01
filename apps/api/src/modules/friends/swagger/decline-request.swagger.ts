import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiDeclineRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Decline a friend request' }),
    ApiParam({ name: 'id', description: 'Friend request UUID' }),
    ApiResponse({ status: 204, description: 'Friend request declined' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Request not found' }),
  );
}
