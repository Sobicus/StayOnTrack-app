'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api, type PublicProfileDto } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslations } from 'next-intl';
import { Flame, Zap, Trophy, Swords } from 'lucide-react';
import { AvatarFrame } from '@/components/ui/avatar-frame';

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { token } = useAuth();
  const t = useTranslations('profile');
  const [profile, setProfile] = useState<PublicProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    api.users
      .getPublicProfile(username as string, token ?? undefined)
      .then(setProfile)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [username, token]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    const isPrivate = error.includes('403') || error.includes('private') || error.includes('friends');
    return (
      <AppShell>
        <div className="text-center py-16 px-4">
          <div className="text-5xl mb-4">{isPrivate ? '🔒' : '👤'}</div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            {isPrivate ? t('privateProfile') : t('notFound')}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {isPrivate ? t('privateProfileDesc') : t('notFoundDesc')}
          </p>
        </div>
      </AppShell>
    );
  }

  if (!profile) return null;

  const avatarLetter = profile.username.charAt(0).toUpperCase();

  return (
    <AppShell>
      {/* Avatar + Username */}
      <div className="flex flex-col items-center mb-6 pt-2">
        <div className="mb-3">
          <AvatarFrame
            frameId={profile.profileFrame}
            size={80}
            avatarSrc={null}
            fallback={avatarLetter}
          />
        </div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">@{profile.username}</h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          {t('memberSince', { date: new Date(profile.joinedAt).toLocaleDateString() })}
        </p>
        <div className="mt-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary font-medium">
          {t('daysTracking', { count: profile.daysTracking })}
        </div>
      </div>

      <div className="space-y-3">
        {/* Streak */}
        {profile.streak && (
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-semibold text-[var(--foreground)]">{t('streak')}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-amber-400">{profile.streak.current}</p>
                <p className="text-xs text-[var(--muted)]">{t('currentStreak')}</p>
              </div>
              <div className="w-px bg-[var(--border)]" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">{profile.streak.best}</p>
                <p className="text-xs text-[var(--muted)]">{t('bestStreak')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {profile.stats && (
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-[var(--foreground)]">{t('stats')}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">
                  {Math.round(profile.stats.calories).toLocaleString()}
                </p>
                <p className="text-[10px] text-[var(--muted)]">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">
                  {profile.stats.money.toFixed(0)}
                </p>
                <p className="text-[10px] text-[var(--muted)]">{t('moneySaved')}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-400">
                  {profile.stats.weightKg.toFixed(1)}
                </p>
                <p className="text-[10px] text-[var(--muted)]">kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements && (
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-achievement" />
                <p className="text-sm font-semibold text-[var(--foreground)]">{t('achievements')}</p>
              </div>
              <span className="text-xs text-achievement font-semibold">
                {profile.achievements.unlocked}/{profile.achievements.total}
              </span>
            </div>
            {profile.achievements.topEmojis.length > 0 ? (
              <div className="flex gap-3">
                {profile.achievements.topEmojis.map((emoji, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl bg-achievement/10 flex items-center justify-center text-2xl"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">{t('noAchievementsYet')}</p>
            )}
          </div>
        )}

        {/* Active Challenges */}
        {profile.activeChallengesCount !== undefined && profile.activeChallengesCount > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {t('activeChallenges', { count: profile.activeChallengesCount })}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
