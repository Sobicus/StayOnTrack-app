export default function StatsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-7 w-36 rounded bg-[var(--card)] animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-[var(--card)] animate-pulse" />
        <div className="h-64 rounded-2xl bg-[var(--card)] animate-pulse" />
      </div>
    </div>
  );
}
