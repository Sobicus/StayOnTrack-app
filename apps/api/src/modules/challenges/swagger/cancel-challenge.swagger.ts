import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiCancelChallenge() {
  return applyDecorators(
    ApiOperation({ summary: 'Cancel a challenge (creator only)' }),
    ApiParam({ name: 'id', description: 'Challenge UUID' }),
    ApiResponse({ status: 204, description: 'Challenge cancelled' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden — not the creator' }),
    ApiResponse({ status: 404, description: 'Challenge not found' }),
  );
}
