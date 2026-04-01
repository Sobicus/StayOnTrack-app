import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetStatsByRange() {
  return applyDecorators(
    ApiOperation({ summary: 'Get stats for a specific date range' }),
    ApiQuery({ name: 'start', required: true, description: 'Start date (YYYY-MM-DD)' }),
    ApiQuery({ name: 'end', required: true, description: 'End date (YYYY-MM-DD)' }),
    ApiResponse({ status: 200, description: 'Stats for range returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
