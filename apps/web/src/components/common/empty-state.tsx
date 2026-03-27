import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="w-12 h-12 text-[var(--muted)] mb-4" />
      <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--muted)] mb-4">{description}</p>}
      {action && (
        <a href={action.href} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">
          {action.label}
        </a>
      )}
    </div>
  );
}
