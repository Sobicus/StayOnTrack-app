import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetLiveStats() {
  return applyDecorators(
    ApiOperation({ summary: 'Get live stats for the hero widget' }),
    ApiResponse({ status: 200, description: 'Live stats returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
