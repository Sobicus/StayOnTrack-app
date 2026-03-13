export default function AchievementsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-32 rounded bg-[var(--card)] animate-pulse" />
          <div className="h-8 w-16 rounded-full bg-[var(--card)] animate-pulse" />
        </div>
        {[1, 2, 3].map((cat) => (
          <div key={cat} className="space-y-2">
            <div className="h-5 w-36 rounded bg-[var(--card)] animate-pulse mb-3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-[var(--card)] animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
