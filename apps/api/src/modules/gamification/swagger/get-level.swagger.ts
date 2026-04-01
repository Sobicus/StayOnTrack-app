import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetLevel() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current level info' }),
    ApiResponse({ status: 200, description: 'Level info returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
