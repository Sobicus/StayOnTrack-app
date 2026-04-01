'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeSelector } from '@/components/settings/theme-selector';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { Save, User, Eye, Trash2, Clock, Coins, Calendar, Download, Bell, Shield, Link2, Ruler, MessageCircle } from 'lucide-react';
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
  const [showStreak, setShowStreak] = useState(user?.showStreak ?? true);
  const [showStats, setShowStats] = useState(user?.showStats ?? true);
  const [showAchievements, setShowAchievements] = useState(user?.showAchievements ?? true);
  const [showActiveChallenges, setShowActiveChallenges] = useState(user?.showActiveChallenges ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      api.gamification.getLevel(token).then((info) => {
        setUserLevel(info.level);
      }).catch(() => {
        // fallback to level 1
      });
    }
  }, [token]);

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

        {/* Streak Shields */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm text-[var(--foreground)]">{t('streakShields')}:</span>
          <span className="text-sm font-semibold text-primary">{user?.streakShieldsRemaining ?? 0}</span>
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

      {/* Profile Section Toggles */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('profileSections')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('profileSectionsDescription')}</p>
        <div className="space-y-2">
          {([
            { key: 'showStreak' as const, value: showStreak, setter: setShowStreak, label: t('showStreak') },
            { key: 'showStats' as const, value: showStats, setter: setShowStats, label: t('showStats') },
            { key: 'showAchievements' as const, value: showAchievements, setter: setShowAchievements, label: t('showAchievements') },
            { key: 'showActiveChallenges' as const, value: showActiveChallenges, setter: setShowActiveChallenges, label: t('showActiveChallenges') },
          ]).map(({ key, value, setter, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-[var(--foreground)]">{label}</span>
              <button
                onClick={() => {
                  const newVal = !value;
                  setter(newVal);
                  api.users.updateProfile(token!, { [key]: newVal }).then(() => {
                    refreshUser();
                    showToast(t('saved'), 'success');
                  }).catch(() => showToast(tc('error'), 'error'));
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-[var(--border)]'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-[var(--foreground)]">{t('theme')}</p>
            <p className="text-xs text-[var(--muted)]">{t('themeDescription')}</p>
          </div>
          <ThemeToggle />
        </div>
        <ThemeSelector userLevel={userLevel} />
      </div>

      {/* Notifications */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('notifications')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('reminderDescription')}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--foreground)]">{t('dailyReminder')}</span>
          <button
            onClick={() => {
              const newVal = !(user?.emailReminders ?? true);
              api.users.updateProfile(token!, { emailReminders: newVal }).then(() => {
                refreshUser();
                showToast(t('saved'), 'success');
              }).catch(() => showToast(tc('error'), 'error'));
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              (user?.emailReminders ?? true) ? 'bg-primary' : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                (user?.emailReminders ?? true) ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {(user?.emailReminders ?? true) && (
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              {t('reminderTime')}
            </label>
            <select
              value={user?.reminderHour ?? 20}
              onChange={(e) => {
                const hour = parseInt(e.target.value);
                api.users.updateProfile(token!, { reminderHour: hour }).then(() => {
                  refreshUser();
                  showToast(t('saved'), 'success');
                }).catch(() => showToast(tc('error'), 'error'));
              }}
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour12 = i % 12 || 12;
                const ampm = i < 12 ? 'AM' : 'PM';
                const label = `${hour12}:00 ${ampm}`;
                return (
                  <option key={i} value={i}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Linked Accounts */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('linkedAccounts')}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm text-[var(--foreground)]">Google</span>
          </div>
          {(user as any)?.googleId ? (
            <span className="text-xs text-green-500 font-medium">{t('googleLinked')}</span>
          ) : (
            <a
              href="http://localhost:4800/api/v1/auth/google"
              className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
            >
              {t('linkGoogle')}
            </a>
          )}
        </div>
      </div>

      {/* Telegram */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('telegram')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('telegramDescription')}</p>

        {user?.telegramLinked ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500 font-medium">{t('telegramLinked')}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await api.users.unlinkTelegram(token!);
                  await refreshUser();
                  showToast(t('saved'), 'success');
                } catch {
                  showToast(tc('error'), 'error');
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-danger/30 text-danger text-xs font-medium hover:bg-danger/10 transition-all"
            >
              {t('unlinkTelegram')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {telegramCode ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--foreground)]">{t('telegramCode')}:</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-lg font-mono font-bold tracking-widest text-primary">
                    {telegramCode}
                  </code>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {t('telegramCodeInstructions')} {telegramCode}
                </p>
                <p className="text-xs text-[var(--muted)]">{t('telegramCodeExpiry')}</p>
              </div>
            ) : (
              <button
                onClick={async () => {
                  setTelegramLoading(true);
                  try {
                    const result = await api.users.generateTelegramCode(token!);
                    setTelegramCode(result.code);
                  } catch {
                    showToast(tc('error'), 'error');
                  } finally {
                    setTelegramLoading(false);
                  }
                }}
                disabled={telegramLoading}
                className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {telegramLoading ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                {t('linkTelegram')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Currency */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('currency')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('currencyDescription')}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {['EUR', 'USD', 'GBP', 'PLN', 'UAH'].map((cur) => (
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

      {/* Unit System */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Ruler className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('unitSystem')}</p>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">{t('unitSystemDescription')}</p>
        <div className="flex items-center gap-2">
          {(['metric', 'imperial'] as const).map((sys) => (
            <button
              key={sys}
              onClick={() => {
                api.users.updateProfile(token!, { unitSystem: sys }).then(() => {
                  refreshUser();
                  showToast(t('saved'), 'success');
                }).catch(() => showToast(tc('error'), 'error'));
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                (user?.unitSystem || 'metric') === sys
                  ? 'bg-primary text-white'
                  : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {t(sys)}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Savings Goal */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-primary" />
          <p className="font-medium text-[var(--foreground)]">{t('monthlySavingsGoal')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            defaultValue={user?.monthlySavingsGoal?.toString() || ''}
            placeholder={t('monthlySavingsGoalPlaceholder')}
            min="0"
            step="any"
            onBlur={(e) => {
              const val = e.target.value ? parseFloat(e.target.value) : undefined;
              const current = user?.monthlySavingsGoal ?? undefined;
              if (val === current) return;
              api.users.updateProfile(token!, { monthlySavingsGoal: val ?? 0 }).then(() => {
                refreshUser();
                showToast(t('saved'), 'success');
              }).catch(() => showToast(tc('error'), 'error'));
            }}
            className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
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
