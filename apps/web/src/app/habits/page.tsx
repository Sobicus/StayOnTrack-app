'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api, ApiError, HabitLog } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { HabitCatalog, CatalogItem } from '@/components/habits/habit-catalog';
import { HabitSparkline } from '@/components/habits/habit-sparkline';
import { addPendingCheckin, hasPendingCheckins } from '@/lib/offline-queue';
import { syncPendingCheckins } from '@/lib/sync-manager';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lock,
} from 'lucide-react';

interface Habit {
  id: string;
  title: string;
  emoji: string;
  category: string;
  caloriesPerOccurrence: number;
  pricePerOccurrence: number;
  frequencyType: string;
  occurrencesPerWeek: number | null;
  isActive: boolean;
}

interface FrequencyStatus {
  habitId: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}

const CATEGORIES = [
  'SWEETS',
  'ALCOHOL',
  'FASTFOOD',
  'SNACKS',
  'DRINKS',
  'CUSTOM',
];

const EMOJI_OPTIONS = ['🍔', '🍕', '🍟', '🍩', '🍫', '🥤', '🍺', '🍷', '🚬', '☕', '🛒', '📱', '🎮', '💊'];

export default function HabitsPage() {
  const { token } = useAuth();
  const t = useTranslations('habits');
  const tc = useTranslations('common');
  const { showToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [rangeLogs, setRangeLogs] = useState<HabitLog[]>([]);
  const [freqStatus, setFreqStatus] = useState<FrequencyStatus[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🍔');
  const [category, setCategory] = useState('CUSTOM');
  const [calories, setCalories] = useState('');
  const [cost, setCost] = useState('');
  const [frequencyType, setFrequencyType] = useState('DAILY');
  const [occurrencesPerWeek, setOccurrencesPerWeek] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
      // Sync any pending offline check-ins when online
      if (typeof window !== 'undefined' && navigator.onLine && hasPendingCheckins()) {
        syncPendingCheckins(token).then(() => loadData());
      }
    }
  }, [token]);

  const loadData = async () => {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const [h, logs, freq, range] = await Promise.all([
        api.habits.list(token!),
        api.habitLogs.today(token!).catch(() => []),
        api.habitLogs.frequencyStatus(token!).catch(() => []),
        api.habitLogs.range(token!, startDate, endDate).catch(() => []),
      ]);
      setHabits(h);
      setTodayLogs(logs);
      setFreqStatus(freq);
      setRangeLogs(range);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingHabit(null);
    setTitle('');
    setEmoji('🍔');
    setCategory('CUSTOM');
    setCalories('');
    setCost('');
    setFrequencyType('DAILY');
    setOccurrencesPerWeek('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (h: Habit) => {
    setEditingHabit(h);
    setTitle(h.title);
    setEmoji(h.emoji || '🍔');
    setCategory(h.category);
    setCalories(h.caloriesPerOccurrence.toString());
    setCost(h.pricePerOccurrence.toString());
    setFrequencyType(h.frequencyType || 'DAILY');
    setOccurrencesPerWeek(h.occurrencesPerWeek?.toString() || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setFormError(t('nameRequired'));
      return;
    }
    setSaving(true);
    setFormError('');

    const data: any = {
      title: title.trim(),
      emoji,
      category,
      caloriesPerOccurrence: parseFloat(calories) || 0,
      pricePerOccurrence: parseFloat(cost) || 0,
      frequencyType,
    };
    if (frequencyType === 'CUSTOM' && occurrencesPerWeek) {
      data.occurrencesPerWeek = parseInt(occurrencesPerWeek, 10);
    } else {
      data.occurrencesPerWeek = null;
    }

    try {
      if (editingHabit) {
        await api.habits.update(token!, editingHabit.id, data);
      } else {
        await api.habits.create(token!, data);
      }
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.data?.message || t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.habits.delete(token!, id);
      await loadData();
    } catch {}
  };

  const handleCheckin = async (habitId: string, status: string, portionRatio: number = 0) => {
    try {
      // Don't send date — backend determines "today" from user.timezone
      await api.habitLogs.checkin(token!, {
        habitId,
        status,
        portionRatio,
      });
      if (status === 'AVOIDED') {
        setCelebratingId(habitId);
        const habit = habits.find((h) => h.id === habitId);
        showToast(
          `${habit?.emoji || '✅'} ${t('avoidedBadge')} ${habit?.caloriesPerOccurrence ? t('kcalSaved', { count: habit.caloriesPerOccurrence }) : ''}`,
          'success',
        );
        setTimeout(() => setCelebratingId(null), 500);
      } else if (status === 'PARTIAL') {
        showToast(t('partial'), 'warning');
      }
      await loadData();
    } catch (err: any) {
      // Network error (not an API error) — save offline
      if (!(err instanceof ApiError)) {
        addPendingCheckin({ habitId, portionRatio, timestamp: Date.now() });
        showToast(tc('savedOffline'), 'warning');
        return;
      }
      const rawMsg = err?.data?.message || t('failedToSave');
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;
      showToast(msg, 'error');
    }
  };

  const getLogForHabit = (habitId: string) =>
    todayLogs.find((l: any) => l.habitId === habitId);

  const getFreqForHabit = (habitId: string): FrequencyStatus | undefined =>
    freqStatus.find((f) => f.habitId === habitId);

  /** Check if a habit has reached its weekly limit and has no log for today */
  const isWeeklyLimitReached = (habitId: string): boolean => {
    const freq = getFreqForHabit(habitId);
    if (!freq || freq.limit === null) return false;
    return freq.remaining === 0;
  };

  /** Build sparkline data (last 7 days) grouped by habitId */
  const sparklineByHabit = useMemo(() => {
    const today = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const logsByHabitDate = new Map<string, Map<string, string>>();
    for (const log of rangeLogs) {
      if (!logsByHabitDate.has(log.habitId)) {
        logsByHabitDate.set(log.habitId, new Map());
      }
      logsByHabitDate.get(log.habitId)!.set(log.date, log.status);
    }

    const result: Record<string, { date: string; status: string | null }[]> = {};
    for (const habit of habits) {
      const habitLogs = logsByHabitDate.get(habit.id);
      result[habit.id] = days.map((date) => ({
        date,
        status: habitLogs?.get(date) ?? null,
      }));
    }
    return result;
  }, [rangeLogs, habits]);

  const handleQuickAdd = async (item: CatalogItem) => {
    try {
      await api.habits.create(token!, {
        title: item.titleKey,
        emoji: item.emoji,
        category: item.category,
        caloriesPerOccurrence: item.calories,
        pricePerOccurrence: item.price,
        frequencyType: 'DAILY',
      });
      showToast(`${item.emoji} ${t('catalog.addedToast')}`, 'success');
      await loadData();
    } catch {
      showToast(t('failedToSave'), 'error');
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{t('myHabits')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          {tc('add')}
        </button>
      </div>

      {/* Quick Add Catalog — show when no habits or always accessible */}
      {habits.length === 0 && (
        <div className="text-center py-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-6">
          <p className="text-[var(--muted)] mb-2">{t('noHabitsYet')}</p>
          <p className="text-sm text-[var(--muted)]">{t('noHabitsHint')}</p>
        </div>
      )}

      <HabitCatalog onQuickAdd={handleQuickAdd} />

      {/* Habit list with check-in */}
      {habits.length > 0 && (
        <div className="space-y-3">
          {habits.map((habit) => {
            const log = getLogForHabit(habit.id);
            const freq = getFreqForHabit(habit.id);
            const limitReached = !log && isWeeklyLimitReached(habit.id);
            return (
              <div
                key={habit.id}
                className={`p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] transition-all ${
                  celebratingId === habit.id ? 'animate-celebrate border-success/50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.emoji}</span>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{habit.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {habit.caloriesPerOccurrence} {tc('kcal')} · €{habit.pricePerOccurrence}
                        {habit.frequencyType && habit.frequencyType !== 'DAILY' && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                            {habit.frequencyType === 'WEEKLY'
                              ? t('frequencyWeekly')
                              : t('frequencyCustom', { count: habit.occurrencesPerWeek || 0 })}
                            {freq && freq.limit !== null && (
                              <span className="ml-1">
                                ({freq.used}/{freq.limit})
                              </span>
                            )}
                          </span>
                        )}
                      </p>
                      {sparklineByHabit[habit.id] && (
                        <HabitSparkline days={sparklineByHabit[habit.id]} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(habit)}
                      className="p-2 rounded-lg text-[var(--muted)] hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-2 rounded-lg text-[var(--muted)] hover:text-danger hover:bg-danger/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Check-in buttons */}
                {log ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)]">
                    <StatusBadge status={log.status} />
                    {log.savedCalories > 0 && (
                      <span className="text-xs text-success ml-auto">
                        {t('kcalSaved', { count: Math.round(log.savedCalories) })}
                      </span>
                    )}
                  </div>
                ) : limitReached ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                    <Lock className="w-4 h-4 text-[var(--muted)]" />
                    <span className="text-xs text-[var(--muted)] font-medium">
                      {t('weeklyLimitReached')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheckin(habit.id, 'AVOIDED', 0)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t('avoided')}
                    </button>
                    <button
                      onClick={() => handleCheckin(habit.id, 'PARTIAL', 0.5)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-all"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {t('partial')}
                    </button>
                    <button
                      onClick={() => handleCheckin(habit.id, 'CONSUMED', 1)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('hadIt')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] rounded-t-3xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {editingHabit ? t('editHabit') : t('newHabit')}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  {t('emoji')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        emoji === e
                          ? 'bg-primary/20 ring-2 ring-primary scale-110'
                          : 'bg-[var(--background)] hover:bg-primary/10'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  {t('category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`categories.${c}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calories */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  {t('caloriesPerOccurrence')}
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder={t('caloriesPlaceholder')}
                  min="0"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  {t('costPerOccurrence')}
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder={t('costPlaceholder')}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  {t('frequency')}
                </label>
                <div className="flex items-center gap-2">
                  {(['DAILY', 'WEEKLY', 'CUSTOM'] as const).map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => {
                        setFrequencyType(ft);
                        if (ft !== 'CUSTOM') setOccurrencesPerWeek('');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        frequencyType === ft
                          ? 'bg-primary text-white'
                          : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {t(`frequencyTypes.${ft}`)}
                    </button>
                  ))}
                </div>
                {frequencyType === 'CUSTOM' && (
                  <div className="mt-2">
                    <input
                      type="number"
                      value={occurrencesPerWeek}
                      onChange={(e) => setOccurrencesPerWeek(e.target.value)}
                      placeholder={t('timesPerWeek')}
                      min="1"
                      max="7"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {editingHabit ? t('saveChanges') : t('createHabit')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('habits');
  const config: Record<string, { icon: typeof CheckCircle2; textKey: string; color: string }> = {
    AVOIDED: { icon: CheckCircle2, textKey: 'avoidedBadge', color: 'text-success' },
    PARTIAL: { icon: AlertCircle, textKey: 'partial', color: 'text-warning' },
    CONSUMED: { icon: XCircle, textKey: 'hadIt', color: 'text-danger' },
  };
  const c = config[status] || config.CONSUMED;
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${c.color}`}>
      <c.icon className="w-4 h-4" />
      {t(c.textKey)}
    </div>
  );
}
