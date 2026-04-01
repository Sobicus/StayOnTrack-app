import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetChallenges() {
  return applyDecorators(
    ApiOperation({ summary: 'List all challenges for the current user' }),
    ApiResponse({ status: 200, description: 'Challenges returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
