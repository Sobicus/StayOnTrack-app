'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api, type Challenge, type ChallengeParticipant, type Habit } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import {
  Swords,
  Plus,
  Trophy,
  Crown,
  Target,
  Clock,
  Check,
  X,
  ChevronRight,
  Flame,
  DollarSign,
  Zap,
} from 'lucide-react';

type Tab = 'active' | 'invitations' | 'completed';

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

export default function ChallengesPage() {
  const { token, user } = useAuth();
  const t = useTranslations('challenges');
  const tc = useTranslations('common');
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('active');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [invitations, setInvitations] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('CALORIES');
  const [targetValue, setTargetValue] = useState('');
  const [habitId, setHabitId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  useEffect(() => {
    // Set default dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      const [ch, inv, h] = await Promise.all([
        api.challenges.list(token!).catch(() => []),
        api.challenges.invitations(token!).catch(() => []),
        api.habits.list(token!).catch(() => []),
      ]);
      setChallenges(ch);
      setInvitations(inv);
      setHabits(h.filter((h: any) => h.isActive));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const activeChallenges = challenges.filter((c) => c.status === 'ACTIVE');
  const completedChallenges = challenges.filter(
    (c) => c.status === 'COMPLETED' || c.status === 'CANCELLED',
  );

  const handleCreate = async () => {
    if (!title.trim() || !targetValue || !inviteUsername.trim()) return;
    setCreating(true);
    try {
      const data: any = {
        title: title.trim(),
        type,
        targetValue: parseFloat(targetValue),
        startDate,
        endDate,
        inviteUsername: inviteUsername.trim(),
      };
      if (type === 'HABIT' && habitId) {
        data.habitId = habitId;
      }
      await api.challenges.create(token!, data);
      showToast(t('created'), 'success');
      setShowCreate(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      const msg = err?.data?.message || t('createFailed');
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await api.challenges.accept(token!, id);
      showToast(t('accepted'), 'success');
      await loadData();
    } catch {
      showToast(tc('error'), 'error');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.challenges.decline(token!, id);
      showToast(t('declined'), 'success');
      await loadData();
    } catch {
      showToast(tc('error'), 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t('cancelConfirm'))) return;
    try {
      await api.challenges.cancel(token!, id);
      showToast(t('cancelled'), 'success');
      await loadData();
    } catch {
      showToast(tc('error'), 'error');
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('CALORIES');
    setTargetValue('');
    setHabitId('');
    setInviteUsername('');
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getOpponent = (challenge: Challenge) => {
    return challenge.participants.find((p) => p.userId !== user?.id);
  };

  const getMyParticipant = (challenge: Challenge) => {
    return challenge.participants.find((p) => p.userId === user?.id);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{t('title')}</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('newChallenge')}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {/* Type selection */}
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t('type')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['HABIT', 'CALORIES', 'STREAK', 'MONEY'].map((ct) => {
                const Icon = typeIcons[ct] || Target;
                return (
                  <button
                    key={ct}
                    onClick={() => setType(ct)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                      type === ct
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(`types.${ct}` as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habit selector (if HABIT type) */}
          {type === 'HABIT' && (
            <select
              value={habitId}
              onChange={(e) => setHabitId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">{t('selectHabit')}</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.emoji} {h.title}
                </option>
              ))}
            </select>
          )}

          {/* Target */}
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">
              {t('target')} ({t(`targetHints.${type}` as any)})
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              min="1"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">{t('startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">{t('endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Invite username */}
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">{t('inviteFriend')}</label>
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder={t('invitePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !targetValue || !inviteUsername.trim()}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('creating')}
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                {t('create')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        {([
          { key: 'active' as Tab, icon: Swords, label: t('tabActive'), count: activeChallenges.length },
          { key: 'invitations' as Tab, icon: Clock, label: t('tabInvitations'), count: invitations.length },
          { key: 'completed' as Tab, icon: Trophy, label: t('tabCompleted'), count: completedChallenges.length },
        ]).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === item.key
                ? 'bg-primary text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            {item.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === item.key ? 'bg-white/20' : 'bg-primary/10 text-primary'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active challenges */}
      {tab === 'active' && (
        <div>
          {activeChallenges.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <Swords className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--muted)] mb-1">{t('noChallenges')}</p>
              <p className="text-xs text-[var(--muted)]">{t('noChallengesHint')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeChallenges.map((ch) => (
                <ChallengeCard
                  key={ch.id}
                  challenge={ch}
                  userId={user?.id || ''}
                  t={t}
                  tc={tc}
                  onCancel={handleCancel}
                  getDaysLeft={getDaysLeft}
                  getOpponent={getOpponent}
                  getMyParticipant={getMyParticipant}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invitations */}
      {tab === 'invitations' && (
        <div>
          {invitations.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <Clock className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--muted)]">{t('noInvitations')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((ch) => {
                const Icon = typeIcons[ch.type] || Target;
                const colorClass = typeColors[ch.type] || 'text-gray-500 bg-gray-500/10';
                return (
                  <div
                    key={ch.id}
                    className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[var(--foreground)]">{ch.title}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {ch.creatorUsername} {t('vs')} {t('you')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-3">
                      <Target className="w-3.5 h-3.5" />
                      <span>{t('target_label', { value: ch.targetValue })}</span>
                      <span className="mx-1">·</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('daysLeft', { count: getDaysLeft(ch.endDate) })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(ch.id)}
                        className="flex-1 py-2 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        {t('accept')}
                      </button>
                      <button
                        onClick={() => handleDecline(ch.id)}
                        className="flex-1 py-2 rounded-xl bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        {t('decline')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed */}
      {tab === 'completed' && (
        <div>
          {completedChallenges.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <Trophy className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--muted)]">{t('noChallenges')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedChallenges.map((ch) => (
                <ChallengeCard
                  key={ch.id}
                  challenge={ch}
                  userId={user?.id || ''}
                  t={t}
                  tc={tc}
                  onCancel={handleCancel}
                  getDaysLeft={getDaysLeft}
                  getOpponent={getOpponent}
                  getMyParticipant={getMyParticipant}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function ChallengeCard({
  challenge: ch,
  userId,
  t,
  tc,
  onCancel,
  getDaysLeft,
  getOpponent,
  getMyParticipant,
}: {
  challenge: Challenge;
  userId: string;
  t: any;
  tc: any;
  onCancel: (id: string) => void;
  getDaysLeft: (d: string) => number;
  getOpponent: (c: Challenge) => ChallengeParticipant | undefined;
  getMyParticipant: (c: Challenge) => ChallengeParticipant | undefined;
}) {
  const Icon = typeIcons[ch.type] || Target;
  const colorClass = typeColors[ch.type] || 'text-gray-500 bg-gray-500/10';
  const opponent = getOpponent(ch);
  const me = getMyParticipant(ch);
  const daysLeft = getDaysLeft(ch.endDate);
  const isCompleted = ch.status === 'COMPLETED';
  const isCancelled = ch.status === 'CANCELLED';
  const isWinner = ch.winnerId === userId;

  const maxValue = Math.max(me?.currentValue || 0, opponent?.currentValue || 0, 1);
  const myProgress = ((me?.currentValue || 0) / ch.targetValue) * 100;
  const opponentProgress = ((opponent?.currentValue || 0) / ch.targetValue) * 100;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isWinner
        ? 'bg-warning/5 border-warning/20'
        : isCancelled
          ? 'bg-[var(--card)] border-[var(--border)] opacity-60'
          : 'bg-[var(--card)] border-[var(--border)]'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-[var(--foreground)]">{ch.title}</p>
            {isWinner && <Crown className="w-4 h-4 text-warning" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>{t(`types.${ch.type}` as any)}</span>
            <span>·</span>
            {isCompleted ? (
              <span className="text-success font-medium">{t('statusCompleted')}</span>
            ) : isCancelled ? (
              <span className="text-danger font-medium">{t('statusCancelled')}</span>
            ) : (
              <span>{t('daysLeft', { count: daysLeft })}</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      {me && (
        <div className="space-y-2 mb-3">
          {/* My progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-primary">
                {t('you')}
                {isCompleted && isWinner && (
                  <span className="ml-1 text-warning">🏆</span>
                )}
              </span>
              <span className="text-xs font-bold text-[var(--foreground)]">
                {Math.round(me.currentValue)}
              </span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(myProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Opponent progress */}
          {opponent && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--muted)]">
                  {opponent.username}
                  {opponent.status === 'INVITED' && (
                    <span className="ml-1 text-warning text-[10px]">({t('invited')})</span>
                  )}
                  {isCompleted && ch.winnerId === opponent.userId && (
                    <span className="ml-1 text-warning">🏆</span>
                  )}
                </span>
                <span className="text-xs font-bold text-[var(--foreground)]">
                  {Math.round(opponent.currentValue)}
                </span>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--muted)] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(opponentProgress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Target line */}
          <div className="flex items-center justify-end">
            <span className="text-[10px] text-[var(--muted)]">
              {t('target_label', { value: ch.targetValue })}
            </span>
          </div>
        </div>
      )}

      {/* Cancel button for active challenges (creator only) */}
      {ch.status === 'ACTIVE' && ch.creatorUserId === userId && (
        <button
          onClick={() => onCancel(ch.id)}
          className="w-full py-2 rounded-xl text-xs text-danger hover:bg-danger/10 transition-all"
        >
          {t('cancel')}
        </button>
      )}
    </div>
  );
}
