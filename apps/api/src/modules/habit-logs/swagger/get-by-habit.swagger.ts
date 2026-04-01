import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetByHabit() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get logs for a specific habit' }),
    ApiParam({ name: 'habitId', description: 'Habit UUID' }),
    ApiQuery({ name: 'start', required: false, description: 'Start date (YYYY-MM-DD)' }),
    ApiQuery({ name: 'end', required: false, description: 'End date (YYYY-MM-DD)' }),
    ApiResponse({ status: 200, description: 'Habit logs returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Habit not found' }),
  );
}
