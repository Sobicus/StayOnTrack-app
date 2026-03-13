'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Save, User } from 'lucide-react';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();

  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || '');
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || '');
  const [goal, setGoal] = useState(user?.goal || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.users.updateProfile(token!, {
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        goal: goal || undefined,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-6">Settings</h1>

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
                Weight (kg) <span className="text-[var(--muted)] font-normal">— optional</span>
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="optional"
                min="20"
                max="300"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Height (cm) <span className="text-[var(--muted)] font-normal">— optional</span>
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="optional"
                min="50"
                max="300"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Stay clean for 30 days"
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saved ? (
              'Saved!'
            ) : saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--foreground)]">Theme</p>
            <p className="text-xs text-[var(--muted)]">Light / Dark mode</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </AppShell>
  );
}
