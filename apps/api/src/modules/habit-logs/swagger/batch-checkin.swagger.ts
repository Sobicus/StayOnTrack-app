import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiBatchCheckin() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Batch check-in for multiple habits at once' }),
    ApiResponse({ status: 201, description: 'Batch check-in recorded successfully' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
