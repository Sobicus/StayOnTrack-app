import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiBrowsePublic() {
  return applyDecorators(
    ApiOperation({ summary: 'Browse public challenges' }),
    ApiResponse({ status: 200, description: 'Public challenges returned' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
