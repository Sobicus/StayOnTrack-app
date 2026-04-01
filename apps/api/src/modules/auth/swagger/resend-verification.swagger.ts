import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiResendVerification() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Resend email verification code' }),
    ApiResponse({ status: 200, description: 'Verification email sent' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
