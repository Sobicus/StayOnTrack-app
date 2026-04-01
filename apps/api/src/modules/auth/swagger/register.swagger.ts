import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user account' }),
    ApiResponse({ status: 201, description: 'User registered successfully' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 409, description: 'Email already in use' }),
  );
}
