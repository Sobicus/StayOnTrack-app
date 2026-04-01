'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Lock } from 'lucide-react';
import { FRAMES, getFrameById, getFrameWidth } from '@/lib/frames';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import type { Achievement } from '@/lib/api';

interface FrameSelectorProps {
  token: string;
  currentFrame: string | null;
}

export function FrameSelector({ token, currentFrame }: FrameSelectorProps) {
  const t = useTranslations('settings');
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<string>(currentFrame ?? 'none');
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set(['none']));
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load achievements to determine which frames are unlocked
    api.achievements.get(token).then((data) => {
      const unlocked = new Set<string>(['none']);
      const unlockedAchIds = new Set(
        data.achievements.filter((a: Achievement) => a.unlocked).map((a: Achievement) => a.id),
      );
      for (const frame of FRAMES) {
        if (!frame.unlockAchievementId || unlockedIds.has(frame.id)) continue;
        if (unlockedAchIds.has(frame.unlockAchievementId)) {
          unlocked.add(frame.id);
        }
      }
      setUnlockedIds(unlocked);
    }).catch(() => {/* ignore — keep defaults */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSelect = async (frameId: string) => {
    if (!unlockedIds.has(frameId)) return;
    if (saving) return;
    setSelectedId(frameId);
    setSaving(true);
    try {
      await api.users.updateProfile(token, { profileFrame: frameId === 'none' ? null : frameId });
      showToast(t('frameApplied'), 'success');
    } catch {
      showToast(t('saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return <div className="h-40" />;

  return (
    <div>
      <p className="font-medium text-[var(--foreground)] mb-1">{t('profileFrame')}</p>
      <p className="text-xs text-[var(--muted)] mb-3">{t('profileFrameDesc')}</p>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {FRAMES.map((frame) => {
          const isUnlocked = unlockedIds.has(frame.id);
          const isSelected = frame.id === selectedId;
          const borderW = getFrameWidth(frame.tier);
          const previewSize = 44;
          const totalSize = previewSize + borderW * 2 + 4;

          // Animation class for preview
          const animClass =
            frame.animation === 'spin'
              ? 'frame-spin'
              : frame.animation === 'spin-pulse'
                ? 'frame-spin-pulse'
                : '';

          return (
            <button
              key={frame.id}
              onClick={() => handleSelect(frame.id)}
              disabled={!isUnlocked}
              className={`flex flex-col items-center gap-1.5 group transition-opacity ${
                isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              title={isUnlocked ? frame.name : frame.unlockHint}
            >
              {/* Mini avatar preview with frame */}
              <div
                style={{
                  position: 'relative',
                  width: totalSize,
                  height: totalSize,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                  boxShadow: isSelected
                    ? `0 0 0 2px var(--accent-color), ${frame.glowColor ? `0 0 8px 2px ${frame.glowColor}` : ''}`
                    : frame.glowColor && isUnlocked
                      ? `0 0 6px 1px ${frame.glowColor}`
                      : undefined,
                }}
              >
                {/* Gradient ring */}
                {frame.id !== 'none' && (
                  <div
                    className={animClass}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '160%',
                      height: '160%',
                      background: frame.gradient,
                      ...(frame.animation === 'none'
                        ? { transform: 'translate(-50%, -50%)' }
                        : {}),
                      '--frame-speed': `${frame.spinSpeed ?? 4}s`,
                    } as React.CSSProperties}
                  />
                )}

                {/* Avatar inner */}
                <div
                  style={{
                    position: 'absolute',
                    inset: frame.id !== 'none' ? borderW : 0,
                    borderRadius: '50%',
                    backgroundColor: 'var(--card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: frame.id !== 'none' ? 2 : 0,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'var(--accent-color)',
                      opacity: isUnlocked ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    {isSelected ? (
                      <Check style={{ width: 14, height: 14 }} />
                    ) : !isUnlocked ? (
                      <Lock style={{ width: 12, height: 12 }} />
                    ) : (
                      'A'
                    )}
                  </div>
                </div>
              </div>

              {/* Label */}
              <span className="text-[10px] leading-tight text-center text-[var(--muted)] truncate w-full">
                {isUnlocked ? frame.name : frame.unlockHint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
