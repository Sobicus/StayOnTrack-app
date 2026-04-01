'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { Flame, ListChecks, CheckCircle2, BarChart3, ChevronRight } from 'lucide-react';

const ONBOARDING_KEY = 'stayontrack_onboarding_done';

const stepIcons = [Flame, ListChecks, CheckCircle2, BarChart3];
const stepColors = ['text-primary', 'text-warning', 'text-success', 'text-streak'];
const stepBgColors = ['bg-primary/10', 'bg-warning/10', 'bg-success/10', 'bg-streak/10'];

export function useOnboarding() {
  const { user, token, refreshUser } = useAuth();

  const [done, setDone] = useState(() => {
    // Check server-side flag first, then localStorage fallback
    if (user?.onboardingCompleted) return true;
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  const complete = async () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setDone(true);
    // Persist to server
    if (token) {
      try {
        await api.users.updateProfile(token, { onboardingCompleted: true });
        await refreshUser();
      } catch {
        // localStorage fallback is fine
      }
    }
  };

  return { showOnboarding: !done, completeOnboarding: complete };
}

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations('onboarding');
  const [step, setStep] = useState(0);
  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const Icon = stepIcons[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--background)]">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl ${stepBgColors[step]} mb-8 animate-fade-in`}>
          <Icon className={`w-12 h-12 ${stepColors[step]}`} />
        </div>

        {/* Title */}
        <h1 key={`title-${step}`} className="text-2xl font-bold text-[var(--foreground)] mb-3 animate-fade-in">
          {t(`step${step + 1}Title`)}
        </h1>

        {/* Text */}
        <p key={`text-${step}`} className="text-[var(--muted)] mb-10 animate-fade-in">
          {t(`step${step + 1}Text`)}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : 'w-2 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNext}
            className="w-full py-3.5 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            {step === totalSteps - 1 ? t('letsGo') : t('next')}
            {step < totalSteps - 1 && <ChevronRight className="w-5 h-5" />}
          </button>
          {step < totalSteps - 1 && (
            <button
              onClick={onComplete}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors py-2"
            >
              {t('skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
