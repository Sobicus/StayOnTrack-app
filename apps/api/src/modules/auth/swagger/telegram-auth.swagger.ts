import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiTelegramAuth() {
  return applyDecorators(
    ApiOperation({ summary: 'Authenticate via Telegram Mini App initData' }),
    ApiResponse({ status: 200, description: 'Authentication successful, tokens returned' }),
    ApiResponse({ status: 400, description: 'Invalid Telegram initData' }),
    ApiResponse({ status: 401, description: 'Telegram authentication failed' }),
  );
}
