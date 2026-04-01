import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteLog() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Undo a check-in (delete a habit log)' }),
    ApiParam({ name: 'id', description: 'Habit log UUID' }),
    ApiResponse({ status: 204, description: 'Check-in deleted successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Habit log not found' }),
  );
}
