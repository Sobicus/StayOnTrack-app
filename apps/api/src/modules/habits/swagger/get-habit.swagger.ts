import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiGetHabit() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get a single habit by ID' }),
    ApiParam({ name: 'id', description: 'Habit UUID' }),
    ApiResponse({ status: 200, description: 'Habit returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Habit not found' }),
  );
}
