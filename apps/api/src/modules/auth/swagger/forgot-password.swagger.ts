import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Request a password reset email' }),
    ApiResponse({ status: 200, description: 'Reset email sent if account exists' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  );
}
