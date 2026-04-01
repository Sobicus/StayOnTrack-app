import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetByDateRange() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get habit logs for a date range' }),
    ApiQuery({ name: 'start', required: true, description: 'Start date (YYYY-MM-DD)' }),
    ApiQuery({ name: 'end', required: true, description: 'End date (YYYY-MM-DD)' }),
    ApiResponse({ status: 200, description: 'Habit logs returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
