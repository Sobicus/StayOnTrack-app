import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteHabit() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Delete a habit' }),
    ApiParam({ name: 'id', description: 'Habit UUID' }),
    ApiResponse({ status: 204, description: 'Habit deleted successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Habit not found' }),
  );
}
