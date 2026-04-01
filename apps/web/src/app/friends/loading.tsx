export default function FriendsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-7 w-24 rounded bg-[var(--card)] animate-pulse mb-6" />
        <div className="h-10 rounded-xl bg-[var(--card)] animate-pulse" />
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-[var(--card)] animate-pulse" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--card)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
