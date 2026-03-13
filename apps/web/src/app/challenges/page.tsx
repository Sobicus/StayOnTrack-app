'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Users,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  Globe,
} from 'lucide-react';

type Tab = 'active' | 'invitations' | 'completed' | 'browse';

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
  const router = useRouter();
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

  // Group challenge fields
  const [challengeMode, setChallengeMode] = useState<'1v1' | 'group'>('1v1');
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [inviteUsernames, setInviteUsernames] = useState<string[]>([]);
  const [currentInviteInput, setCurrentInviteInput] = useState('');

  // Join by code
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Browse public challenges
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Copied state for invite codes
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    if (!title.trim() || !targetValue) return;
    if (challengeMode === '1v1' && !inviteUsername.trim()) return;
    setCreating(true);
    try {
      const data: any = {
        title: title.trim(),
        type,
        targetValue: parseFloat(targetValue),
        startDate,
        endDate,
      };
      if (challengeMode === '1v1') {
        data.inviteUsername = inviteUsername.trim();
      } else {
        // Group mode
        data.maxParticipants = maxParticipants;
        data.visibility = visibility;
        // For group challenges, invite the first username if provided
        if (inviteUsernames.length > 0) {
          data.inviteUsername = inviteUsernames[0];
        }
      }
      if (type === 'HABIT' && habitId) {
        data.habitId = habitId;
      }
      const created = await api.challenges.create(token!, data);
      // If group mode and more usernames to invite, invite them
      if (challengeMode === 'group' && inviteUsernames.length > 1) {
        await api.challenges.inviteMultiple(token!, created.id, inviteUsernames.slice(1)).catch(() => {});
      }
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

  const handleJoinByCode = async () => {
    if (!joinCode.trim() || joinCode.trim().length !== 8) return;
    setJoining(true);
    try {
      await api.challenges.joinByCode(token!, joinCode.trim());
      showToast(t('accepted'), 'success');
      setJoinCode('');
      await loadData();
    } catch (err: any) {
      const msg = err?.data?.message || tc('error');
      showToast(msg, 'error');
    } finally {
      setJoining(false);
    }
  };

  const addInviteUsername = () => {
    const username = currentInviteInput.trim();
    if (username && !inviteUsernames.includes(username)) {
      setInviteUsernames([...inviteUsernames, username]);
      setCurrentInviteInput('');
    }
  };

  const removeInviteUsername = (username: string) => {
    setInviteUsernames(inviteUsernames.filter((u) => u !== username));
  };

  const copyInviteCode = async (code: string, challengeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(challengeId);
      showToast(t('copied'), 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast(tc('error'), 'error');
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

  const loadBrowse = async () => {
    setBrowseLoading(true);
    try {
      const data = await api.challenges.browse(token!);
      setPublicChallenges(data);
    } catch {
      setPublicChallenges([]);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleJoinPublic = async (challenge: Challenge) => {
    if (!challenge.inviteCode) return;
    setJoiningId(challenge.id);
    try {
      await api.challenges.joinByCode(token!, challenge.inviteCode);
      showToast(t('joined'), 'success');
      setPublicChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      await loadData();
    } catch (err: any) {
      const msg = err?.data?.message || t('joinFailed');
      showToast(msg, 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('CALORIES');
    setTargetValue('');
    setHabitId('');
    setInviteUsername('');
    setChallengeMode('1v1');
    setMaxParticipants(5);
    setVisibility('PRIVATE');
    setInviteUsernames([]);
    setCurrentInviteInput('');
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

      {/* Join by Code */}
      <div className="mb-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <label className="text-xs font-medium text-[var(--muted)] mb-2 block">{t('joinByCode')}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="ABCD1234"
            maxLength={8}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm font-mono tracking-widest placeholder:text-[var(--muted)] placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleJoinByCode}
            disabled={joining || joinCode.trim().length !== 8}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {joining ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {t('join')}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
          {/* Mode toggle: 1v1 vs Group */}
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t('challengeMode')}</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setChallengeMode('1v1')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  challengeMode === '1v1'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted)]'
                }`}
              >
                <Swords className="w-4 h-4" />
                {t('vs1v1')}
              </button>
              <button
                onClick={() => setChallengeMode('group')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  challengeMode === 'group'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted)]'
                }`}
              >
                <Users className="w-4 h-4" />
                {t('group')}
              </button>
            </div>
          </div>

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

          {/* Group-specific: Max Participants */}
          {challengeMode === 'group' && (
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">
                {t('maxParticipants')}: {maxParticipants}
              </label>
              <input
                type="range"
                min={2}
                max={20}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                <span>2</span>
                <span>20</span>
              </div>
            </div>
          )}

          {/* Group-specific: Visibility */}
          {challengeMode === 'group' && (
            <div>
              <label className="text-xs text-[var(--muted)] mb-1.5 block">{t('visibility')}</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setVisibility('PRIVATE')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all border ${
                    visibility === 'PRIVATE'
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted)]'
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                  {t('private')}
                </button>
                <button
                  onClick={() => setVisibility('PUBLIC')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all border ${
                    visibility === 'PUBLIC'
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted)]'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {t('public')}
                </button>
              </div>
            </div>
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

          {/* Invite: single username for 1v1 */}
          {challengeMode === '1v1' && (
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
          )}

          {/* Invite: multi-username for group */}
          {challengeMode === 'group' && (
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">{t('inviteFriends')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentInviteInput}
                  onChange={(e) => setCurrentInviteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInviteUsername();
                    }
                  }}
                  placeholder={t('invitePlaceholder')}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={addInviteUsername}
                  disabled={!currentInviteInput.trim()}
                  className="px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 disabled:opacity-50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {inviteUsernames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {inviteUsernames.map((username) => (
                    <span
                      key={username}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                    >
                      {username}
                      <button
                        onClick={() => removeInviteUsername(username)}
                        className="hover:text-danger transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={
              creating ||
              !title.trim() ||
              !targetValue ||
              (challengeMode === '1v1' && !inviteUsername.trim())
            }
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
          { key: 'browse' as Tab, icon: Globe, label: t('browse'), count: 0 },
          { key: 'invitations' as Tab, icon: Clock, label: t('tabInvitations'), count: invitations.length },
          { key: 'completed' as Tab, icon: Trophy, label: t('tabCompleted'), count: completedChallenges.length },
        ]).map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key);
              if (item.key === 'browse' && publicChallenges.length === 0) loadBrowse();
            }}
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
                  onCopyCode={copyInviteCode}
                  copiedId={copiedId}
                  onClick={() => router.push(`/challenges/${ch.id}`)}
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
                  onCopyCode={copyInviteCode}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Browse Public */}
      {tab === 'browse' && (
        <div>
          {browseLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : publicChallenges.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <Globe className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--muted)]">{t('noPublicChallenges')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicChallenges.map((ch) => {
                const BrowseIcon = typeIcons[ch.type] || Target;
                const browseColorClass = typeColors[ch.type] || 'text-gray-500 bg-gray-500/10';
                const participantCount = ch.participants?.length || 0;
                const openSpots = ch.maxParticipants - participantCount;
                const isFull = openSpots <= 0;
                return (
                  <div
                    key={ch.id}
                    className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${browseColorClass}`}>
                        <BrowseIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[var(--foreground)]">{ch.title}</p>
                        {ch.description && (
                          <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{ch.description}</p>
                        )}
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {t('createdBy', { username: ch.creatorUsername })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-3">
                      <Target className="w-3.5 h-3.5" />
                      <span>{t('target_label', { value: ch.targetValue })}</span>
                      <span className="mx-1">·</span>
                      <Users className="w-3.5 h-3.5" />
                      <span>{participantCount}/{ch.maxParticipants}</span>
                      <span className="mx-1">·</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('daysLeft', { count: getDaysLeft(ch.endDate) })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isFull && (
                        <span className="text-xs text-success">
                          {t('openSpots', { open: openSpots })}
                        </span>
                      )}
                      {isFull && (
                        <span className="text-xs text-danger">
                          {t('full')}
                        </span>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleJoinPublic(ch)}
                        disabled={isFull || joiningId === ch.id}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        {joiningId === ch.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        {t('joinChallenge')}
                      </button>
                    </div>
                  </div>
                );
              })}
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
  onCopyCode,
  copiedId,
  onClick,
}: {
  challenge: Challenge;
  userId: string;
  t: any;
  tc: any;
  onCancel: (id: string) => void;
  getDaysLeft: (d: string) => number;
  getOpponent: (c: Challenge) => ChallengeParticipant | undefined;
  getMyParticipant: (c: Challenge) => ChallengeParticipant | undefined;
  onCopyCode?: (code: string, challengeId: string) => void;
  copiedId?: string | null;
  onClick?: () => void;
}) {
  const Icon = typeIcons[ch.type] || Target;
  const colorClass = typeColors[ch.type] || 'text-gray-500 bg-gray-500/10';
  const me = getMyParticipant(ch);
  const otherParticipants = ch.participants.filter((p) => p.userId !== userId);
  const isGroupChallenge = ch.maxParticipants > 2;
  const daysLeft = getDaysLeft(ch.endDate);
  const isCompleted = ch.status === 'COMPLETED';
  const isCancelled = ch.status === 'CANCELLED';
  const isWinner = ch.winnerId === userId;
  const isCreator = ch.creatorUserId === userId;

  const myProgress = ((me?.currentValue || 0) / ch.targetValue) * 100;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        onClick ? 'cursor-pointer hover:border-primary/30' : ''
      } ${
        isWinner
          ? 'bg-warning/5 border-warning/20'
          : isCancelled
            ? 'bg-[var(--card)] border-[var(--border)] opacity-60'
            : 'bg-[var(--card)] border-[var(--border)]'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-[var(--foreground)]">{ch.title}</p>
            {isWinner && <Crown className="w-4 h-4 text-warning" />}
            {isGroupChallenge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-medium">
                <Users className="w-3 h-3 inline mr-0.5" />
                {ch.participants.length}/{ch.maxParticipants}
              </span>
            )}
            {onClick && <ChevronRight className="w-4 h-4 text-[var(--muted)] ml-auto" />}
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

      {/* Invite code for creator */}
      {isCreator && ch.inviteCode && onCopyCode && (
        <div
          className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-[var(--background)] border border-[var(--border)]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-[var(--muted)] uppercase tracking-wide">{t('inviteCode')}:</span>
          <code className="text-xs font-mono font-bold text-primary tracking-widest flex-1">{ch.inviteCode}</code>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyCode(ch.inviteCode!, ch.id);
            }}
            className="p-1 rounded-lg hover:bg-primary/10 transition-all text-[var(--muted)] hover:text-primary"
          >
            {copiedId === ch.id ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

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

          {/* Other participants progress */}
          {otherParticipants.map((participant) => {
            const participantProgress = ((participant.currentValue || 0) / ch.targetValue) * 100;
            return (
              <div key={participant.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--muted)]">
                    {participant.username}
                    {participant.status === 'INVITED' && (
                      <span className="ml-1 text-warning text-[10px]">({t('invited')})</span>
                    )}
                    {isCompleted && ch.winnerId === participant.userId && (
                      <span className="ml-1 text-warning">🏆</span>
                    )}
                  </span>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {Math.round(participant.currentValue)}
                  </span>
                </div>
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--muted)] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(participantProgress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Target line */}
          <div className="flex items-center justify-end">
            <span className="text-[10px] text-[var(--muted)]">
              {t('target_label', { value: ch.targetValue })}
            </span>
          </div>
        </div>
      )}

      {/* Cancel button for active challenges (creator only) */}
      {ch.status === 'ACTIVE' && isCreator && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(ch.id);
          }}
          className="w-full py-2 rounded-xl text-xs text-danger hover:bg-danger/10 transition-all"
        >
          {t('cancel')}
        </button>
      )}
    </div>
  );
}
