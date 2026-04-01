import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetDaySummary() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get check-in summary for a specific day' }),
    ApiQuery({ name: 'date', required: false, description: 'Target date (YYYY-MM-DD). Defaults to today.' }),
    ApiResponse({ status: 200, description: 'Day summary returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
