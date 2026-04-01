import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiJoinChallenge() {
  return applyDecorators(
    ApiOperation({ summary: 'Join a challenge by invite code' }),
    ApiResponse({ status: 201, description: 'Successfully joined challenge' }),
    ApiResponse({ status: 400, description: 'Invalid or expired invite code' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
