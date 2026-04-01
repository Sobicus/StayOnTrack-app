import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetInvitations() {
  return applyDecorators(
    ApiOperation({ summary: 'Get pending challenge invitations' }),
    ApiResponse({ status: 200, description: 'Invitations returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
