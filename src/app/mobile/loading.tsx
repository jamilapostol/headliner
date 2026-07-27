export default function Loading() {
  return (
    <div className="flex flex-col gap-3 px-4 py-5">
      <div className="h-7 w-40 animate-pulse rounded-md bg-white/[.06]" />
      <div className="h-4 w-56 animate-pulse rounded-md bg-white/[.04]" />
      <div className="h-40 animate-pulse rounded-card border border-border bg-surface" />
      <div className="h-40 animate-pulse rounded-card border border-border bg-surface" />
    </div>
  );
}
