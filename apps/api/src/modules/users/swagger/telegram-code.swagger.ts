import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGenerateTelegramCode() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Generate a one-time code to link Telegram account' }),
    ApiResponse({ status: 201, description: 'Telegram link code generated' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
