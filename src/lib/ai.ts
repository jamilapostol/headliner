// Pilot AI — deterministic, template-based "AI" for the MVP so these
// features work end-to-end without an external LLM key. Swap the bodies of
// these two functions for real Claude calls behind /api/ai when ready; the
// call sites (bookings drawer, contracts panel) don't need to change.

export function planUnlocksAI(plan: string) {
  return plan === "touring" || plan === "team";
}

export function draftFollowupEmail(opts: { promoter: string | null; venue: string; city: string; date: string; artistName: string }) {
  const promoter = opts.promoter || "there";
  const cityShort = opts.city.split(",")[0];
  const dateLabel = new Date(opts.date).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

  return `Hi ${promoter},

Just circling back on the ${dateLabel} hold at ${opts.venue}. We're routing through ${cityShort} that week and would love to lock it in — happy to share updated numbers from this spring's run (avg 240 tickets in comparable rooms).

Could we confirm by Friday?

Best,
${opts.artistName}`;
}

export type ContractFact = { flag: "✓" | "!"; text: string };

export function summarizeContract(kind: string, status: string, value: string): ContractFact[] {
  if (status === "DRAFT") {
    return [
      { flag: "!", text: "This agreement hasn't been sent for signature yet — review terms before sending." },
      { flag: "!", text: "No countersigned copy on file. Confirm payment terms match your standard rider." },
    ];
  }

  switch (kind) {
    case "Performance":
      return [
        { flag: "✓", text: "Guarantee wired as 50% deposit, balance night-of in cash or Zelle." },
        { flag: "✓", text: "Venue provides full backline, house engineer, and 2 hotel rooms." },
        { flag: "!", text: "Radius clause: no shows within 60 mi for 45 days — check against nearby holds." },
        { flag: "!", text: "Cancellation within 30 days forfeits deposit; no force-majeure carve-out." },
      ];
    case "Sponsorship":
      return [
        { flag: "✓", text: `Annual commitment of ${value}, paid quarterly.` },
        { flag: "✓", text: "Logo placement and 2 social posts per quarter satisfy the brand deliverables." },
        { flag: "!", text: "Auto-renews unless cancelled 60 days before term end — set a reminder." },
      ];
    case "Licensing":
      return [
        { flag: "✓", text: `One-time sync fee of ${value} for festival and streaming use.` },
        { flag: "!", text: "Territory is North America only — confirm before any international placement." },
      ];
    case "Insurance":
      return [
        { flag: "✓", text: `Coverage renews at ${value} — general liability, $1M per occurrence.` },
        { flag: "!", text: "Some venues require a certificate naming them as additionally insured — request ahead of the show." },
      ];
    case "Work-for-hire":
      return [
        { flag: "✓", text: `Session rate of ${value}, work-for-hire — no royalty obligation.` },
        { flag: "!", text: "No exclusivity clause — player is free to work other dates in this window." },
      ];
    default:
      return [{ flag: "✓", text: "No flagged risks in this agreement." }];
  }
}
