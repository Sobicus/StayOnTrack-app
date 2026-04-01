import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetStats() {
  return applyDecorators(
    ApiOperation({ summary: 'Get cumulative user stats' }),
    ApiResponse({ status: 200, description: 'Stats returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
