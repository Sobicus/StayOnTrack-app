import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetFunnel() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user conversion funnel data' }),
    ApiResponse({ status: 200, description: 'Funnel data returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
