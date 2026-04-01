import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication.
 * All other routes will redirect to /auth/login if no token cookie/header found.
 */
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/** Prefixes that are always public (static assets, API proxy, etc.) */
const PUBLIC_PREFIXES = ['/_next', '/api', '/icon', '/manifest', '/sw.js', '/robots.txt', '/sitemap'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public prefixes (static assets, etc.)
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow exact public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token in localStorage isn't possible in middleware,
  // but we can check for a cookie or just let client-side handle it.
  // Since we store tokens in localStorage (not cookies), we use a lightweight
  // approach: check for a marker cookie set by the client after login.
  const hasAuth = request.cookies.get('stayontrack_authenticated');

  if (!hasAuth) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
