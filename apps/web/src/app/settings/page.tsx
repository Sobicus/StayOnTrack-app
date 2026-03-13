'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { Save, User, Eye, Trash2, Clock, Coins, Calendar, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

const VISIBILITY_OPTIONS = ['PRIVATE', 'FRIENDS', 'PUBLIC'] as const;

export default function SettingsPage() {
  const { user, token, refreshUser, logout } = useAuth();
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { showToast } = useToast();

  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || '');
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || '');
  const [goal, setGoal] = useState(user?.goal || '');
  const [visibility, setVisibility] = useState(user?.visibility || 'PRIVATE');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.users.updateProfile(token!, {
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        goal: goal || undefined,
        visibility,
      });
      await refreshUser();
      setSaved(true);
      showToast(t('saved'), 'success');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      showToast(tc('error'), 'error');
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-6">{t('title')}</h1>

      {/* Profile */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-[var(--foreground)]">{user?.username}</p>
            <p className="text-xs text-[var(--muted)]">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                {t('weightKg')} <span className="text-[var(--muted)] font-normal">— {tc('optional')}</span>
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder={tc('optional')}
                min="20"
                max="300"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                {t('heightCm')} <span className="text-[var(--muted)] font-normal">— {tc('optional')}</span>
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder={tc('optional')}
                min="50"
                max="300"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              {t('goal')}
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t('goalPlaceholder')}
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saved ? (
              t('saved')
            ) : saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('saveProfile')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('privacy')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('privacyDescription')}</p>
        <div className="flex items-center gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setVisibility(opt);
                // Auto-save visibility change
                api.users.updateProfile(token!, { visibility: opt }).then(() => {
                  refreshUser();
                  showToast(t('saved'), 'success');
                }).catch(() => showToast(tc('error'), 'error'));
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                visibility === opt
                  ? 'bg-primary text-white'
                  : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {t(`visibility.${opt}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--foreground)]">{t('language')}</p>
            <p className="text-xs text-[var(--muted)]">{t('languageDescription')}</p>
          </div>
          <LocaleSwitcher />
        </div>
      </div>

      {/* Theme */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--foreground)]">{t('theme')}</p>
            <p className="text-xs text-[var(--muted)]">{t('themeDescription')}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Currency */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('currency')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('currencyDescription')}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {['EUR', 'USD', 'GBP', 'PLN', 'UAH', 'RUB'].map((cur) => (
            <button
              key={cur}
              onClick={() => {
                api.users.updateProfile(token!, { currency: cur }).then(() => {
                  refreshUser();
                  showToast(t('saved'), 'success');
                }).catch(() => showToast(tc('error'), 'error'));
              }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                (user?.currency || 'EUR') === cur
                  ? 'bg-primary text-white'
                  : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {t(`currencies.${cur}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Week Start */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('weekStart')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('weekStartDescription')}</p>
        <div className="flex items-center gap-2">
          {['monday', 'sunday'].map((day) => (
            <button
              key={day}
              onClick={() => {
                api.users.updateProfile(token!, { weekStartDay: day }).then(() => {
                  refreshUser();
                  showToast(t('saved'), 'success');
                }).catch(() => showToast(tc('error'), 'error'));
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                (user?.weekStartDay || 'monday') === day
                  ? 'bg-primary text-white'
                  : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {t(`weekDays.${day}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Day End */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('dayEnd')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('dayEndDescription')}</p>
        <select
          value={user?.dayEndHour ?? 0}
          onChange={(e) => {
            const hour = parseInt(e.target.value);
            api.users.updateProfile(token!, { dayEndHour: hour }).then(() => {
              refreshUser();
              showToast(t('saved'), 'success');
            }).catch(() => showToast(tc('error'), 'error'));
          }}
          className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? t('midnight') : `${i.toString().padStart(2, '0')}:00`}
            </option>
          ))}
        </select>
      </div>

      {/* Data Export (GDPR) */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('exportData')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('exportDataDescription')}</p>
        <button
          onClick={async () => {
            try {
              const data = await api.users.exportData(token!);
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `stayontrack-export-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
              showToast(t('exportSuccess'), 'success');
            } catch {
              showToast(tc('error'), 'error');
            }
          }}
          className="px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--border)] transition-all flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          {t('downloadData')}
        </button>
      </div>

      {/* Danger zone — Delete account */}
      <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 mt-8">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-danger" />
          <p className="font-medium text-danger">{t('dangerZone')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('deleteAccountDescription')}</p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-xl border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-all"
          >
            {t('deleteAccount')}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-danger font-medium">{t('deleteConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await api.users.deleteAccount(token!);
                    logout();
                    router.push('/');
                  } catch {
                    showToast(tc('error'), 'error');
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger/90 disabled:opacity-50 transition-all"
              >
                {deleting ? '...' : t('confirmDelete')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[var(--background)] text-[var(--muted)] text-sm font-medium hover:text-[var(--foreground)] transition-all"
              >
                {tc('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
