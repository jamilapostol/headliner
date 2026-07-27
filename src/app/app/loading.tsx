export default function Loading() {
  return (
    <div className="flex h-full flex-col gap-3.5 px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 h-7 w-40 animate-pulse rounded-md bg-white/[.06]" />
      <div className="mb-2 h-4 w-64 animate-pulse rounded-md bg-white/[.04]" />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-card border border-border bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card border border-border bg-surface" />
    </div>
  );
}
