export const STAGES = [
  { key: "Lead", label: "LEAD", dot: "rgba(247,241,230,.35)" },
  { key: "Contacted", label: "CONTACTED", dot: "#38B6E8" },
  { key: "Negotiating", label: "NEGOTIATING", dot: "#FFC93C" },
  { key: "Offer_Sent", label: "OFFER SENT", dot: "#FF7A2F" },
  { key: "Confirmed", label: "CONFIRMED", dot: "#3FCB86" },
  { key: "Paid", label: "PAID", dot: "#3FCB86" },
] as const;

export type Stage = (typeof STAGES)[number]["key"];

export function stageDot(stage: Stage): string {
  return STAGES.find((s) => s.key === stage)?.dot ?? STAGES[0].dot;
}

const CHIP_STYLE: Record<Stage, { bg: string; color: string }> = {
  Lead: { bg: "rgba(247,241,230,.08)", color: "rgba(247,241,230,.55)" },
  Contacted: { bg: "rgba(56,182,232,.14)", color: "#38B6E8" },
  Negotiating: { bg: "rgba(255,201,60,.14)", color: "#FFC93C" },
  Offer_Sent: { bg: "rgba(255,122,47,.14)", color: "#FF7A2F" },
  Confirmed: { bg: "rgba(63,203,134,.14)", color: "#3FCB86" },
  Paid: { bg: "rgba(63,203,134,.14)", color: "#3FCB86" },
};

export function stageChipStyle(stage: Stage): { bg: string; color: string } {
  return CHIP_STYLE[stage] ?? CHIP_STYLE.Lead;
}
