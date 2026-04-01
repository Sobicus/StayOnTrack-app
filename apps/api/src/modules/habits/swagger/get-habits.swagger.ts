import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetHabits() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get all habits for the current user' }),
    ApiQuery({ name: 'active', required: false, description: 'Filter to active habits only (pass "true")' }),
    ApiResponse({ status: 200, description: 'List of habits returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
