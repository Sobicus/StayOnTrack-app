import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetIncoming() {
  return applyDecorators(
    ApiOperation({ summary: 'Get incoming friend requests' }),
    ApiResponse({ status: 200, description: 'Incoming requests returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
