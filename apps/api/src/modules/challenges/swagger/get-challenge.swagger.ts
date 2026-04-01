import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiGetChallenge() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single challenge with progress' }),
    ApiParam({ name: 'id', description: 'Challenge UUID' }),
    ApiResponse({ status: 200, description: 'Challenge returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Challenge not found' }),
  );
}
