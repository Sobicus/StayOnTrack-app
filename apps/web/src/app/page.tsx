'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('landing');
  const tc = useTranslations('common');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
          <Flame className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">
          {tc('appName')}
        </h1>
        <p className="text-lg text-[var(--muted)] mb-8">
          {t('tagline')}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/register"
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all text-center"
          >
            {t('getStarted')}
          </Link>
          <Link
            href="/auth/login"
            className="w-full py-3 px-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--border)]/50 transition-all text-center"
          >
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
