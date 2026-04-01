import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh access token using a refresh token' }),
    ApiResponse({ status: 200, description: 'New tokens returned' }),
    ApiResponse({ status: 401, description: 'Invalid or expired refresh token' }),
  );
}
