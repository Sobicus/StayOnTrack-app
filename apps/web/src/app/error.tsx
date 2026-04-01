'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Something went wrong
        </h1>
        <p className="text-[var(--muted)] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl font-medium hover:bg-[var(--border)] transition-all"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
