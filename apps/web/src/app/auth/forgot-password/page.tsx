'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch {
      setError(t('forgotPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToLogin')}
        </Link>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {t('forgotPasswordTitle')}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          {t('forgotPasswordHint')}
        </p>

        {sent ? (
          <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-center">
            <Mail className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-sm text-[var(--foreground)] font-medium">
              {t('forgotPasswordSent')}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {t('forgotPasswordCheck')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                t('sendResetLink')
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
