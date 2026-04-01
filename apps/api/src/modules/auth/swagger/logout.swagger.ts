import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogout() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Log out and revoke refresh token' }),
    ApiResponse({ status: 204, description: 'Logged out successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
