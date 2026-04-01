import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiDeclineChallenge() {
  return applyDecorators(
    ApiOperation({ summary: 'Decline a challenge invitation' }),
    ApiParam({ name: 'id', description: 'Challenge UUID' }),
    ApiResponse({ status: 204, description: 'Challenge declined' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Challenge not found' }),
  );
}
