import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiExportMyData() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Export all user data as JSON (GDPR)' }),
    ApiResponse({ status: 200, description: 'User data export returned successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
