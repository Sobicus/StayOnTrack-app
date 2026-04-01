'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { Bell } from 'lucide-react';

export function PushPermission() {
  const { token } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show after first interaction if not already subscribed
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!token) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setShow(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await api.notifications.subscribe(token, subscription.toJSON());
      setShow(false);
    } catch {
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">Enable notifications?</p>
          <p className="text-xs text-[var(--muted)]">Get reminders for check-ins</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setShow(false)} className="flex-1 py-2 text-sm rounded-lg text-[var(--muted)]">
          Later
        </button>
        <button onClick={handleSubscribe} className="flex-1 py-2 text-sm rounded-lg bg-primary text-white font-medium">
          Enable
        </button>
      </div>
    </div>
  );
}
