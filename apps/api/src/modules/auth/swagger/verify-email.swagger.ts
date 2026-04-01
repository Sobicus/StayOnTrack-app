import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiVerifyEmail() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Verify email address with a verification code' }),
    ApiResponse({ status: 200, description: 'Email verified successfully' }),
    ApiResponse({ status: 400, description: 'Invalid or expired code' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
