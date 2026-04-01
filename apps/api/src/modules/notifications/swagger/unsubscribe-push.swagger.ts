import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiUnsubscribePush() {
  return applyDecorators(
    ApiOperation({ summary: 'Unsubscribe from push notifications' }),
    ApiResponse({ status: 204, description: 'Unsubscribed' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
