import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Log in with email and password' }),
    ApiResponse({ status: 200, description: 'Login successful, tokens returned' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
  );
}
