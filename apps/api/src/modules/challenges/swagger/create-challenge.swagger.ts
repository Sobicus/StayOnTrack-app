import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCreateChallenge() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new challenge and invite a friend' }),
    ApiResponse({ status: 201, description: 'Challenge created' }),
    ApiResponse({ status: 400, description: 'Invalid input' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
