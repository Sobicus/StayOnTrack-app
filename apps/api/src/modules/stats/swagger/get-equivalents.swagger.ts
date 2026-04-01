import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetEquivalents() {
  return applyDecorators(
    ApiOperation({ summary: 'Get effort equivalents for user stats' }),
    ApiQuery({ name: 'weight', required: false, description: 'Body weight in kg' }),
    ApiResponse({ status: 200, description: 'Equivalents returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
