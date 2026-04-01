import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCheckQuests() {
  return applyDecorators(
    ApiOperation({ summary: 'Check and update all daily quests, awarding XP for completed ones' }),
    ApiResponse({ status: 201, description: 'Quests checked and XP awarded' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
