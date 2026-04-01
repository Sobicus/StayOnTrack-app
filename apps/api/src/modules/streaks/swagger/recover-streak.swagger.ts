import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiRecoverStreak() {
  return applyDecorators(
    ApiOperation({ summary: 'Recover a broken streak by spending XP' }),
    ApiResponse({ status: 201, description: 'Streak recovered' }),
    ApiResponse({ status: 400, description: 'Insufficient XP or streak not recoverable' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
