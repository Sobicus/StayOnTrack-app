'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api, type Challenge, type ChallengeParticipant } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Target,
  Clock,
  Copy,
  Check,
  UserPlus,
  Users,
  Flame,
  DollarSign,
  Zap,
  Swords,
} from 'lucide-react';

const typeIcons: Record<string, typeof Flame> = {
  HABIT: Target,
  CALORIES: Flame,
  STREAK: Zap,
  MONEY: DollarSign,
};

const typeColors: Record<string, string> = {
  HABIT: 'text-blue-500 bg-blue-500/10',
  CALORIES: 'text-orange-500 bg-orange-500/10',
  STREAK: 'text-purple-500 bg-purple-500/10',
  MONEY: 'text-green-500 bg-green-500/10',
};

const statusBadgeStyles: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success',
  COMPLETED: 'bg-primary/10 text-primary',
  PENDING: 'bg-warning/10 text-warning',
  CANCELLED: 'bg-danger/10 text-danger',
};

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();
  const t = useTranslations('challenges');
  const tc = useTranslations('common');
  const { showToast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (token && id) loadChallenge();
  }, [token, id]);

  const loadChallenge = async () => {
    try {
      const data = await api.challenges.get(token!, id);
      setChallenge(data);
    } catch {
      showToast(tc('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleCopyCode = async () => {
    if (!challenge?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(challenge.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim() || !token) return;
    setInviting(true);
    try {
      // Re-create the challenge invite by username — use the existing API
      // The backend should support adding participants
      await api.challenges.invite(token, id, inviteUsername.trim());
      showToast(t('inviteSent'), 'success');
      setInviteUsername('');
      await loadChallenge();
    } catch (err: any) {
      const msg = err?.data?.message || tc('error');
      showToast(msg, 'error');
    } finally {
      setInviting(false);
    }
  };

  const sortedParticipants = challenge
    ? [...challenge.participants].sort((a, b) => b.currentValue - a.currentValue)
    : [];

  const isCreator = challenge?.creatorUserId === user?.id;
  const isCompleted = challenge?.status === 'COMPLETED';
  const isActive = challenge?.status === 'ACTIVE';
  const daysLeft = challenge ? getDaysRemaining(challenge.endDate) : 0;
  const spotsOpen = challenge
    ? challenge.maxParticipants - challenge.participants.length
    : 0;

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!challenge) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <Swords className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
          <p className="text-[var(--muted)]">{tc('error')}</p>
          <button
            onClick={() => router.push('/challenges')}
            className="mt-4 text-primary text-sm font-medium hover:underline"
          >
            {tc('back')}
          </button>
        </div>
      </AppShell>
    );
  }

  const Icon = typeIcons[challenge.type] || Target;
  const colorClass = typeColors[challenge.type] || 'text-gray-500 bg-gray-500/10';
  const statusStyle = statusBadgeStyles[challenge.status] || 'bg-gray-500/10 text-gray-500';

  return (
    <AppShell>
      {/* Back button */}
      <button
        onClick={() => router.push('/challenges')}
        className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {tc('back')}
      </button>

      {/* Header */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-[var(--foreground)]">{challenge.title}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle}`}>
                {t(`status${challenge.status.charAt(0) + challenge.status.slice(1).toLowerCase()}` as any)}
              </span>
            </div>
            {challenge.description && (
              <p className="text-sm text-[var(--muted)] mb-2">{challenge.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {t('target_label', { value: challenge.targetValue })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {isCompleted
                  ? t('completed')
                  : t('timeRemaining', { days: daysLeft })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Your Progress */}
      {user && (() => {
        const myParticipant = challenge.participants.find(p => p.userId === user.id);
        if (!myParticipant) return null;
        const progressPct = Math.min((myParticipant.currentValue / challenge.targetValue) * 100, 100);
        return (
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('yourProgress')}</h2>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[var(--muted)]">
                {Math.round(myParticipant.currentValue)} / {challenge.targetValue}
              </span>
              <span className="text-xs font-medium text-primary">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Leaderboard */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{t('rank')}</h2>
        </div>
        <div className="space-y-2">
          {sortedParticipants.map((participant, index) => {
            const rank = index + 1;
            const isCurrentUser = participant.userId === user?.id;
            const isWinner = isCompleted && challenge.winnerId === participant.userId;
            const progressPct = Math.min(
              (participant.currentValue / challenge.targetValue) * 100,
              100,
            );

            const rankDisplay =
              rank === 1 ? '\u{1F947}' : rank === 2 ? '\u{1F948}' : rank === 3 ? '\u{1F949}' : `${rank}`;

            return (
              <div
                key={participant.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrentUser
                    ? 'bg-primary/5 border border-primary/20'
                    : 'bg-[var(--background)]'
                }`}
              >
                {/* Rank */}
                <span className="w-8 text-center text-sm font-bold">
                  {rankDisplay}
                </span>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-xs font-medium text-[var(--muted)] overflow-hidden flex-shrink-0">
                  {participant.avatarUrl ? (
                    <img
                      src={participant.avatarUrl}
                      alt={participant.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    participant.username.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium truncate ${
                      isCurrentUser ? 'text-primary' : 'text-[var(--foreground)]'
                    }`}>
                      {participant.username}
                      {isCurrentUser && (
                        <span className="text-xs text-[var(--muted)] ml-1">({t('you')})</span>
                      )}
                    </span>
                    {isWinner && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                        <Crown className="w-3 h-3" />
                        {t('winner')}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrentUser ? 'bg-primary' : 'bg-[var(--muted)]'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Value */}
                <span className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
                  {Math.round(participant.currentValue)}
                  <span className="text-[10px] text-[var(--muted)] font-normal">
                    /{challenge.targetValue}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite section (creator only, active challenge) */}
      {isCreator && isActive && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{t('inviteFriend')}</h2>
            </div>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {t('spotsOpen', {
                open: spotsOpen,
                total: challenge.maxParticipants,
              })}
            </span>
          </div>

          {/* Invite code */}
          {challenge.inviteCode && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] font-mono truncate">
                {challenge.inviteCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
                title="Copy"
              >
                {codeCopied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Invite by username */}
          {spotsOpen > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder={t('inviteByUsername')}
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInvite();
                }}
              />
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteUsername.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {inviting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
