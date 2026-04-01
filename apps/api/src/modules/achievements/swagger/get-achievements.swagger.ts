import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAchievements() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all achievements for the current user' }),
    ApiResponse({ status: 200, description: 'Achievements returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
