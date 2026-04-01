import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetHabitTemplates() {
  return applyDecorators(
    ApiOperation({ summary: 'Get available habit templates' }),
    ApiResponse({ status: 200, description: 'List of habit templates returned successfully' }),
  );
}
