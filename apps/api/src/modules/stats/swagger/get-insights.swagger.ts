import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetInsights() {
  return applyDecorators(
    ApiOperation({ summary: 'Get human-readable insight strings' }),
    ApiResponse({ status: 200, description: 'Insights returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
