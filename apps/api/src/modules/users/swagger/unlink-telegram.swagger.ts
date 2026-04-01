import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiUnlinkTelegram() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Unlink Telegram account from user profile' }),
    ApiResponse({ status: 204, description: 'Telegram account unlinked successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
