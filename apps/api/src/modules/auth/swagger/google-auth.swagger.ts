import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGoogleAuth() {
  return applyDecorators(
    ApiOperation({ summary: 'Initiate Google OAuth login (redirects to Google)' }),
    ApiResponse({ status: 302, description: 'Redirect to Google OAuth consent screen' }),
  );
}

export function ApiGoogleCallback() {
  return applyDecorators(
    ApiOperation({ summary: 'Google OAuth callback — redirects to frontend with tokens' }),
    ApiResponse({ status: 302, description: 'Redirect to frontend with access and refresh tokens' }),
    ApiResponse({ status: 401, description: 'Google authentication failed' }),
  );
}
