'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  UserPlus,
  Users,
  Trophy,
  Check,
  X,
  UserMinus,
  Send,
  Clock,
  Crown,
  Medal,
} from 'lucide-react';

type Tab = 'friends' | 'requests' | 'leaderboard';

interface Friend {
  id: string;
  friendId: string;
  username: string;
  avatarUrl: string | null;
  since: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: string;
  createdAt: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  value: number;
  rank: number;
}

export default function FriendsPage() {
  const { token, user } = useAuth();
  const t = useTranslations('friends');
  const tc = useTranslations('common');
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [addUsername, setAddUsername] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [f, inc, out, lb] = await Promise.all([
        api.friends.list(token!).catch(() => []),
        api.friends.incomingRequests(token!).catch(() => []),
        api.friends.outgoingRequests(token!).catch(() => []),
        api.friends.leaderboard(token!).catch(() => []),
      ]);
      setFriends(f);
      setIncoming(inc);
      setOutgoing(out);
      setLeaderboard(lb);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!addUsername.trim()) return;
    setSending(true);
    try {
      await api.friends.sendRequest(token!, addUsername.trim());
      showToast(t('requestSent'), 'success');
      setAddUsername('');
      await loadData();
    } catch (err: any) {
      const msg = err?.data?.message || t('requestFailed');
      showToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await api.friends.acceptRequest(token!, id);
      showToast(t('requestAccepted'), 'success');
      await loadData();
    } catch {
      showToast(tc('error'), 'error');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.friends.declineRequest(token!, id);
      await loadData();
    } catch {
      showToast(tc('error'), 'error');
    }
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm(t('removeConfirm'))) return;
    try {
      await api.friends.remove(token!, friendId);
      await loadData();
    } catch {
      showToast(tc('error'), 'error');
    }
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
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-4">{t('title')}</h1>

      {/* Add friend input */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={addUsername}
          onChange={(e) => setAddUsername(e.target.value)}
          placeholder={t('addPlaceholder')}
          onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleSendRequest}
          disabled={sending || !addUsername.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              {t('add')}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        {([
          { key: 'friends' as Tab, icon: Users, label: t('tabFriends'), count: friends.length },
          { key: 'requests' as Tab, icon: Clock, label: t('tabRequests'), count: incoming.length },
          { key: 'leaderboard' as Tab, icon: Trophy, label: t('tabLeaderboard'), count: 0 },
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

      {/* Friends list */}
      {tab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <Users className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--muted)] mb-1">{t('noFriends')}</p>
              <p className="text-xs text-[var(--muted)]">{t('noFriendsHint')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]"
                >
                  <Link href={`/u/${friend.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[var(--foreground)]">{friend.username}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {t('friendSince', { date: new Date(friend.since).toLocaleDateString() })}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemove(friend.friendId)}
                    className="p-2 rounded-lg text-[var(--muted)] hover:text-danger hover:bg-danger/10 transition-all"
                    title={t('remove')}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {/* Incoming */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
              {t('incoming')}
            </h2>
            {incoming.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-4 text-center">{t('noIncoming')}</p>
            ) : (
              <div className="space-y-2">
                {incoming.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {req.fromUsername.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-[var(--foreground)]">{req.fromUsername}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="p-2 rounded-lg text-success hover:bg-success/10 transition-all"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
              {t('outgoing')}
            </h2>
            {outgoing.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-4 text-center">{t('noOutgoing')}</p>
            ) : (
              <div className="space-y-2">
                {outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center">
                        <Send className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[var(--foreground)]">{req.toUsername}</p>
                        <p className="text-xs text-warning">{t('pending')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === 'leaderboard' && (
        <div>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <Trophy className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--muted)]">{t('noLeaderboard')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    entry.userId === user?.id
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-[var(--card)] border-[var(--border)]'
                  }`}
                >
                  <div className="w-8 flex items-center justify-center">
                    {entry.rank === 1 ? (
                      <Crown className="w-5 h-5 text-warning" />
                    ) : entry.rank === 2 ? (
                      <Medal className="w-5 h-5 text-[#C0C0C0]" />
                    ) : entry.rank === 3 ? (
                      <Medal className="w-5 h-5 text-[#CD7F32]" />
                    ) : (
                      <span className="text-sm font-bold text-[var(--muted)]">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {entry.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      entry.userId === user?.id ? 'text-primary' : 'text-[var(--foreground)]'
                    }`}>
                      {entry.username}
                      {entry.userId === user?.id && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {t('you')}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(entry.value).toLocaleString()} {tc('kcal')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
