import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiSendWeeklyDigest() {
  return applyDecorators(
    ApiOperation({ summary: 'Trigger weekly digest emails for all users with reminders enabled' }),
    ApiResponse({ status: 200, description: 'Weekly digests sent' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
