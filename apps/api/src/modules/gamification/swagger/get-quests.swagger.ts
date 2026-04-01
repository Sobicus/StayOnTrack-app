import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetQuests() {
  return applyDecorators(
    ApiOperation({ summary: "Get today's daily quests with completion status" }),
    ApiResponse({ status: 200, description: 'Daily quests returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
