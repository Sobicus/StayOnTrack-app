export default function ChallengesLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-28 rounded bg-[var(--card)] animate-pulse" />
          <div className="h-10 w-36 rounded-xl bg-[var(--card)] animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-[var(--card)] animate-pulse" />
          ))}
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-[var(--card)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
