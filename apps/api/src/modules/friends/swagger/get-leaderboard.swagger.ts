import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetLeaderboard() {
  return applyDecorators(
    ApiOperation({ summary: 'Get friend leaderboard' }),
    ApiQuery({ name: 'metric', required: false, description: 'Leaderboard metric (e.g. savedCalories)' }),
    ApiResponse({ status: 200, description: 'Leaderboard returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
