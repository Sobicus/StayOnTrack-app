import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset password using a valid reset token' }),
    ApiResponse({ status: 200, description: 'Password reset successfully' }),
    ApiResponse({ status: 400, description: 'Invalid or expired token' }),
  );
}
