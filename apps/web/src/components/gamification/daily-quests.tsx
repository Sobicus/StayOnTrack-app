'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { api, Quest, QuestCheckResult } from '@/lib/api';
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ListChecks,
  Clock,
  Hash,
  Loader2,
} from 'lucide-react';

const QUEST_ICONS: Record<string, React.ReactNode> = {
  log_all_habits: <ListChecks className="w-5 h-5 text-primary" />,
  avoid_fully_one: <CheckCircle2 className="w-5 h-5 text-success" />,
  check_in_before_noon: <Clock className="w-5 h-5 text-warning" />,
  log_3_habits: <Hash className="w-5 h-5 text-streak" />,
};

interface DailyQuestsProps {
  quests: Quest[];
  onQuestsUpdated: (quests: Quest[]) => void;
}

export function DailyQuests({ quests, onQuestsUpdated }: DailyQuestsProps) {
  const { token } = useAuth();
  const t = useTranslations('quests');
  const [checking, setChecking] = useState(false);
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());

  const allDone = quests.length > 0 && quests.every((q) => q.completed);

  const handleCheck = async () => {
    if (!token || checking) return;
    setChecking(true);
    try {
      const result: QuestCheckResult = await api.gamification.checkQuests(token);
      if (result.completedNow.length > 0) {
        setJustCompleted(new Set(result.completedNow));
        setTimeout(() => setJustCompleted(new Set()), 2000);
      }
      onQuestsUpdated(result.quests);
    } catch {
      // silently fail
    } finally {
      setChecking(false);
    }
  };

  if (quests.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">
          {t('title')}
        </h2>
      </div>

      {/* Quest list */}
      <div className="space-y-3">
        {quests.map((quest) => {
          const wasJustCompleted = justCompleted.has(quest.id);
          return (
            <div
              key={quest.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-500 ${
                wasJustCompleted
                  ? 'border-success/50 bg-success/10 scale-[1.02]'
                  : quest.completed
                    ? 'border-[var(--border)] bg-[var(--card)] opacity-75'
                    : 'border-[var(--border)] bg-[var(--card)]'
              }`}
            >
              {/* Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {QUEST_ICONS[quest.questType] || <Circle className="w-5 h-5 text-[var(--muted)]" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    quest.completed
                      ? 'line-through text-[var(--muted)]'
                      : 'text-[var(--foreground)]'
                  }`}
                >
                  {quest.title}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{quest.description}</p>
                {quest.completed && quest.completedAt && (
                  <p className="text-xs text-success mt-1">
                    {t('completed')} {new Date(quest.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {/* Right side: XP + status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {t('xpReward', { xp: quest.xpReward })}
                </span>
                {quest.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--muted)]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {allDone ? (
        <p className="text-center text-sm text-success font-medium mt-4">
          {t('allDone')}
        </p>
      ) : (
        <button
          onClick={handleCheck}
          disabled={checking}
          className="w-full mt-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('checkProgress')}
            </>
          ) : (
            t('checkProgress')
          )}
        </button>
      )}
    </div>
  );
}
