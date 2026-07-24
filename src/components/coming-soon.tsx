export function ComingSoon({ title, phase, description }: { title: string; phase: string; description: string }) {
  return (
    <div className="max-w-[700px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">{title}</h1>
      <div className="mb-6 text-[13px] text-white/50">{description}</div>
      <div className="rounded-card border border-dashed border-white/15 bg-surface px-6 py-10 text-center">
        <div className="mb-2 font-mono text-[11px] tracking-[.14em] text-yellow">{phase}</div>
        <div className="text-[15px] font-semibold">Coming soon</div>
        <div className="mx-auto mt-2 max-w-[380px] text-[13px] text-white/50">
          This module is on the roadmap and will ship after the Phase 1 core (bookings, contacts, calendar, finance and billing) is live.
        </div>
      </div>
    </div>
  );
}
