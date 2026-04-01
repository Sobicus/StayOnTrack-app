import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetRetention() {
  return applyDecorators(
    ApiOperation({ summary: 'Get retention cohort data' }),
    ApiQuery({ name: 'start', required: true, description: 'Start date (ISO format)' }),
    ApiQuery({ name: 'end', required: true, description: 'End date (ISO format)' }),
    ApiResponse({ status: 200, description: 'Retention cohorts returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
