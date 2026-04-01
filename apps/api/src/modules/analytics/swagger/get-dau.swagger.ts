import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetDAU() {
  return applyDecorators(
    ApiOperation({ summary: 'Get daily active users over the last N days' }),
    ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' }),
    ApiResponse({ status: 200, description: 'DAU data returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
