export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Streak card skeleton */}
        <div className="h-32 rounded-2xl bg-[var(--card)] animate-pulse" />

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>

        {/* Check-ins skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-40 rounded bg-[var(--card)] animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
