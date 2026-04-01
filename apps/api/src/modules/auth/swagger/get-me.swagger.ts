import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetMe() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get current authenticated user profile' }),
    ApiResponse({ status: 200, description: 'User profile returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
