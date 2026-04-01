import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetEventsByType() {
  return applyDecorators(
    ApiOperation({ summary: 'Get event counts by type over the last N days' }),
    ApiParam({ name: 'type', description: 'Event type' }),
    ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' }),
    ApiResponse({ status: 200, description: 'Event counts returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
