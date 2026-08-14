// Roadie AI fallbacks — deterministic templates used only when
// ANTHROPIC_API_KEY is unset (see src/lib/claude.ts). With a key configured,
// src/lib/actions/ai.ts makes real Claude calls instead and these are never
// rendered to users.
//
// These templates have not read the workspace's data or the uploaded
// document, so they must never assert a specific fact as if they had:
// no ticket counts, no radius distances, no dollar amounts, no clause
// terms. Anything concrete here would be presented to the user as a
// finding about their real booking or contract. Keep them as prompts to
// check, and let the real Claude path supply specifics.

// Mirrors the server-side gate (requireMinPlan(..., "touring")); beta is
// admin-granted full access, so it belongs here too. This only decides
// whether the UI renders Roadie or an upsell — the real check is server-side.
export function planUnlocksAI(plan: string) {
  return plan === "touring" || plan === "team" || plan === "beta";
}

export function draftFollowupEmail(opts: { contactName: string | null; venue: string; city: string; date: string; artistName: string }) {
  const contactName = opts.contactName || "there";
  const cityShort = opts.city.split(",")[0];
  const dateLabel = new Date(opts.date).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

  return `Hi ${contactName},

Just circling back on the ${dateLabel} hold at ${opts.venue}. We're routing through ${cityShort} that week and would love to lock it in — happy to share recent numbers from comparable rooms if that's useful.

Could we confirm by Friday?

Best,
${opts.artistName}`;
}

export type ContractFact = { flag: "✓" | "!"; text: string };

// Every item is phrased as something to check, never as something found —
// this function has not seen the contract. The "✓" flag is deliberately
// unused: a checkmark reads as "reviewed and clear", which nothing here
// can honestly claim.
export function summarizeContract(kind: string, status: string, _value: string): ContractFact[] {
  if (status === "DRAFT") {
    return [
      { flag: "!", text: "This agreement hasn't been sent for signature yet — review the terms before sending." },
      { flag: "!", text: "No countersigned copy on file. Confirm payment terms match your standard rider." },
    ];
  }

  const common: ContractFact[] = [
    { flag: "!", text: "Check the payment schedule: deposit amount, balance timing, and how it's paid." },
    { flag: "!", text: "Check the cancellation terms, including whether there's a force-majeure carve-out." },
  ];

  switch (kind) {
    case "Performance":
      return [
        { flag: "!", text: "Check for a radius clause — what distance, and for how long either side of the date." },
        ...common,
        { flag: "!", text: "Confirm what the venue provides: backline, engineer, hospitality, lodging." },
      ];
    case "Sponsorship":
      return [
        { flag: "!", text: "Check for an auto-renewal clause and the notice window to cancel." },
        ...common,
        { flag: "!", text: "Confirm the deliverables you're committing to and their cadence." },
      ];
    case "Licensing":
      return [
        { flag: "!", text: "Check the territory and the media the license covers." },
        { flag: "!", text: "Check the term length and whether use extends beyond it." },
        ...common,
      ];
    case "Insurance":
      return [
        { flag: "!", text: "Confirm coverage limits and what's excluded." },
        { flag: "!", text: "Check whether venues can be named as additionally insured, and how to request it." },
      ];
    case "Work-for-hire":
      return [
        { flag: "!", text: "Confirm whether royalties or credit are owed, or whether it's a flat buyout." },
        { flag: "!", text: "Check for exclusivity — whether either side is restricted during the window." },
        ...common,
      ];
    default:
      return common;
  }
}
