'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      localStorage.setItem('stayontrack_token', token);
      localStorage.setItem('stayontrack_refresh_token', refreshToken);
      router.push('/dashboard');
    } else {
      router.push('/auth/login?error=google');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-[var(--muted)]">Authenticating...</div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="text-[var(--muted)]">Loading...</div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
