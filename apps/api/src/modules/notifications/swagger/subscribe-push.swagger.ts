import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiSubscribePush() {
  return applyDecorators(
    ApiOperation({ summary: 'Subscribe to push notifications (Web Push API)' }),
    ApiResponse({ status: 200, description: 'Subscription saved' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
