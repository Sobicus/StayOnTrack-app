'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/habits', label: 'Habits', icon: ListChecks },
  { href: '/achievements', label: 'Awards', icon: Trophy },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <span className="font-bold text-[var(--foreground)]">StayOnTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted)]">{user?.username}</span>
            <button
              onClick={() => { logout(); router.push('/auth/login'); }}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-danger hover:bg-danger/10 transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom navigation — mobile-first */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] border-t border-[var(--border)] safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                  isActive
                    ? 'text-primary'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]',
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
