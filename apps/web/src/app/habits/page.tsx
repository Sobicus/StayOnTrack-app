'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  category: string;
  caloriesPerOccurrence: number;
  costPerOccurrence: number;
  isActive: boolean;
}

const CATEGORIES = [
  'FOOD',
  'DRINKS',
  'SNACKS',
  'SMOKING',
  'ALCOHOL',
  'SHOPPING',
  'SOCIAL_MEDIA',
  'OTHER',
];

const EMOJI_OPTIONS = ['🍔', '🍕', '🍟', '🍩', '🍫', '🥤', '🍺', '🍷', '🚬', '☕', '🛒', '📱', '🎮', '💊'];

export default function HabitsPage() {
  const { token } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍔');
  const [category, setCategory] = useState('FOOD');
  const [calories, setCalories] = useState('');
  const [cost, setCost] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [h, logs] = await Promise.all([
        api.habits.list(token!),
        api.habitLogs.today(token!).catch(() => []),
      ]);
      setHabits(h);
      setTodayLogs(logs);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingHabit(null);
    setName('');
    setEmoji('🍔');
    setCategory('FOOD');
    setCalories('');
    setCost('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (h: Habit) => {
    setEditingHabit(h);
    setName(h.name);
    setEmoji(h.emoji);
    setCategory(h.category);
    setCalories(h.caloriesPerOccurrence.toString());
    setCost(h.costPerOccurrence.toString());
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSaving(true);
    setFormError('');

    const data = {
      name: name.trim(),
      emoji,
      category,
      caloriesPerOccurrence: parseFloat(calories) || 0,
      costPerOccurrence: parseFloat(cost) || 0,
    };

    try {
      if (editingHabit) {
        await api.habits.update(token!, editingHabit.id, data);
      } else {
        await api.habits.create(token!, data);
      }
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this habit?')) return;
    try {
      await api.habits.delete(token!, id);
      await loadData();
    } catch {}
  };

  const handleCheckin = async (habitId: string, status: string, portionRatio: number = 0) => {
    try {
      await api.habitLogs.checkin(token!, {
        habitId,
        status,
        portionRatio,
        date: new Date().toISOString().split('T')[0],
      });
      await loadData();
    } catch {}
  };

  const getLogForHabit = (habitId: string) =>
    todayLogs.find((l: any) => l.habitId === habitId);

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
        <h1 className="text-xl font-bold text-[var(--foreground)]">My Habits</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Habit list with check-in */}
      {habits.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[var(--muted)] mb-2">No habits yet</p>
          <p className="text-sm text-[var(--muted)]">
            Add habits you want to avoid — we&apos;ll track your progress!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const log = getLogForHabit(habit.id);
            return (
              <div
                key={habit.id}
                className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.emoji}</span>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{habit.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {habit.caloriesPerOccurrence} kcal · €{habit.costPerOccurrence}
                      </p>
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
                        +{Math.round(log.savedCalories)} kcal saved
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheckin(habit.id, 'AVOIDED', 0)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Avoided
                    </button>
                    <button
                      onClick={() => handleCheckin(habit.id, 'PARTIAL', 0.5)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-all"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Partial
                    </button>
                    <button
                      onClick={() => handleCheckin(habit.id, 'CONSUMED', 1)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Had it
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
                {editingHabit ? 'Edit Habit' : 'New Habit'}
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
                  Emoji
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
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Fast food burger"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calories */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Calories per occurrence (kcal)
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 550"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Cost per occurrence (€)
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g., 8.50"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
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
                    {editingHabit ? 'Save Changes' : 'Create Habit'}
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
  const config: Record<string, { icon: typeof CheckCircle2; text: string; color: string }> = {
    AVOIDED: { icon: CheckCircle2, text: 'Avoided!', color: 'text-success' },
    PARTIAL: { icon: AlertCircle, text: 'Partial', color: 'text-warning' },
    CONSUMED: { icon: XCircle, text: 'Had it', color: 'text-danger' },
  };
  const c = config[status] || config.CONSUMED;
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${c.color}`}>
      <c.icon className="w-4 h-4" />
      {c.text}
    </div>
  );
}
