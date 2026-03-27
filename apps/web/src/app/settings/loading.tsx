import { ListSkeleton } from '@/components/common/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <div className="animate-pulse h-8 w-40 bg-[var(--border)] rounded-lg mb-6" />
        <ListSkeleton count={4} />
      </div>
    </div>
  );
}
