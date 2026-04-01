import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiAcceptChallenge() {
  return applyDecorators(
    ApiOperation({ summary: 'Accept a challenge invitation' }),
    ApiParam({ name: 'id', description: 'Challenge UUID' }),
    ApiResponse({ status: 204, description: 'Challenge accepted' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Challenge not found' }),
  );
}
