import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetStreaks() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current streak, best streak, and shield status' }),
    ApiResponse({ status: 200, description: 'Streak data returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
