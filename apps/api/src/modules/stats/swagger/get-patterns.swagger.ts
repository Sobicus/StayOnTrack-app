import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetPatterns() {
  return applyDecorators(
    ApiOperation({ summary: 'Get pattern analysis (day-of-week, categories, top habits)' }),
    ApiResponse({ status: 200, description: 'Patterns returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
