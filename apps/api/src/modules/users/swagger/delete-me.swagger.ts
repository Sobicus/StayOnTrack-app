import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteMe() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Delete current user account (irreversible)' }),
    ApiResponse({ status: 204, description: 'Account deleted successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
