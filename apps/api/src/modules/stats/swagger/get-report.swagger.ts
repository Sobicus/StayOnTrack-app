import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetReport() {
  return applyDecorators(
    ApiOperation({ summary: 'Get monthly or yearly wrapped-style report' }),
    ApiQuery({ name: 'period', required: false, enum: ['month', 'year'], description: 'Report period' }),
    ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM for month, YYYY for year)' }),
    ApiResponse({ status: 200, description: 'Report returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
