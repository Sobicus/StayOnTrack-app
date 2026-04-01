import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetWeeklyTrends() {
  return applyDecorators(
    ApiOperation({ summary: 'Get weekly trend data over N months' }),
    ApiQuery({ name: 'months', required: false, description: 'Number of months to look back' }),
    ApiResponse({ status: 200, description: 'Weekly trends returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
