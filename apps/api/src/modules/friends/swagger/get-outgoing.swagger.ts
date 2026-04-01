import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetOutgoing() {
  return applyDecorators(
    ApiOperation({ summary: 'Get outgoing friend requests' }),
    ApiResponse({ status: 200, description: 'Outgoing requests returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
