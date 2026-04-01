import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiSendDailyReminders() {
  return applyDecorators(
    ApiOperation({ summary: 'Trigger daily reminder emails for all qualifying users' }),
    ApiResponse({ status: 200, description: 'Daily reminders sent' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
