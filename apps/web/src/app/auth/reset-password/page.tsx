'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Lock, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordsMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.auth.resetPassword(tokenParam, password);
      setSuccess(true);
    } catch {
      setError(t('resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (!tokenParam) {
    return (
      <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-center">
        <p className="text-sm text-danger font-medium">{t('invalidResetToken')}</p>
        <Link href="/auth/forgot-password" className="text-primary text-sm hover:underline mt-2 inline-block">
          {t('requestNewLink')}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-center">
        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="text-sm text-[var(--foreground)] font-medium">{t('resetPasswordSuccess')}</p>
        <Link href="/auth/login" className="text-primary text-sm hover:underline mt-2 inline-block">
          {t('goToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          {t('newPassword')}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          {t('confirmPassword')}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        ) : (
          t('resetPassword')
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t('resetPasswordTitle')}
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
