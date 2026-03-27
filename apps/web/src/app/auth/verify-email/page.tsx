'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const t = useTranslations('auth');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!token || code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await api.auth.verifyEmail(token, code);
      await refreshUser();
      router.push('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr?.data?.message || t('verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!token || resendCooldown > 0) return;
    try {
      await api.auth.resendVerification(token);
      setResendCooldown(60);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr?.data?.message || t('resendFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('verifyEmail')}</h1>
          <p className="text-sm text-[var(--muted)] mt-2">{t('verifyEmailDescription')}</p>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>
        )}
        <div className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
          >
            {loading ? '...' : t('verify')}
          </button>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="w-full py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {resendCooldown > 0
              ? `${t('resendIn')} ${resendCooldown}s`
              : t('resendCode')}
          </button>
        </div>
      </div>
    </div>
  );
}
