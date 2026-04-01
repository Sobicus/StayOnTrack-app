import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetFrequencyStatus() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get weekly frequency status for all active habits' }),
    ApiQuery({ name: 'date', required: false, description: 'Reference date (YYYY-MM-DD). Defaults to today.' }),
    ApiResponse({ status: 200, description: 'Frequency status returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
