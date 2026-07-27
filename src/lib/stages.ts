export const STAGES = [
  { key: "Lead", label: "LEAD", dot: "rgba(233,236,232,.35)" },
  { key: "Contacted", label: "CONTACTED", dot: "#7ab8e8" },
  { key: "Negotiating", label: "NEGOTIATING", dot: "#e8e43f" },
  { key: "Offer_Sent", label: "OFFER SENT", dot: "#e8983f" },
  { key: "Confirmed", label: "CONFIRMED", dot: "#3fe87a" },
  { key: "Paid", label: "PAID", dot: "#3fe87a" },
] as const;

export type Stage = (typeof STAGES)[number]["key"];

export function stageDot(stage: Stage): string {
  return STAGES.find((s) => s.key === stage)?.dot ?? STAGES[0].dot;
}

const CHIP_STYLE: Record<Stage, { bg: string; color: string }> = {
  Lead: { bg: "rgba(233,236,232,.08)", color: "rgba(233,236,232,.55)" },
  Contacted: { bg: "rgba(122,184,232,.14)", color: "#7ab8e8" },
  Negotiating: { bg: "rgba(232,228,63,.14)", color: "#e8e43f" },
  Offer_Sent: { bg: "rgba(232,152,63,.14)", color: "#e8983f" },
  Confirmed: { bg: "rgba(63,232,122,.14)", color: "#3fe87a" },
  Paid: { bg: "rgba(63,232,122,.14)", color: "#3fe87a" },
};

export function stageChipStyle(stage: Stage): { bg: string; color: string } {
  return CHIP_STYLE[stage] ?? CHIP_STYLE.Lead;
}
