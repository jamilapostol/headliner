"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { planUnlocksAI, summarizeContract } from "@/lib/ai";
import { uploadContractDocument, removeContractDocument, type ActionState } from "@/lib/actions/contracts";

export type ContractDTO = {
  id: string;
  name: string;
  kind: string;
  counterparty: string;
  value: string;
  status: "DRAFT" | "AWAITING_SIGN" | "SIGNED" | "ACTIVE";
  date: string | null;
  renewsAt: string | null;
  fileName: string | null;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  SIGNED: { bg: "rgba(63,232,122,.1)", color: "#3fe87a", label: "SIGNED" },
  ACTIVE: { bg: "rgba(63,232,122,.1)", color: "#3fe87a", label: "ACTIVE" },
  AWAITING_SIGN: { bg: "rgba(232,228,63,.1)", color: "#e8e43f", label: "AWAITING SIGN" },
  DRAFT: { bg: "rgba(255,255,255,.06)", color: "rgba(233,236,232,.5)", label: "DRAFT" },
};

function renewLabel(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 45) return `${days} days left`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function ContractsView({ contracts, plan }: { contracts: ContractDTO[]; plan: string }) {
  const [selId, setSelId] = useState(contracts[0]?.id ?? null);
  const selected = contracts.find((c) => c.id === selId) ?? contracts[0];
  const aiUnlocked = planUnlocksAI(plan);
  const renewals = contracts.filter((c) => c.renewsAt).sort((a, b) => new Date(a.renewsAt!).getTime() - new Date(b.renewsAt!).getTime());

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Contracts</h1>
      <div className="mb-[18px] text-[13px] text-white/50">Agreements, riders and renewals.</div>

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <div className="min-w-[520px]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-border px-[18px] py-[11px] font-mono text-[10.5px] tracking-[.1em] text-white/40">
            <div>AGREEMENT</div>
            <div>COUNTERPARTY</div>
            <div>VALUE</div>
            <div>STATUS</div>
          </div>
          {contracts.map((c) => {
            const s = STATUS_STYLE[c.status];
            return (
              <div
                key={c.id}
                onClick={() => setSelId(c.id)}
                className="grid cursor-pointer grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 border-b border-white/[.05] px-[18px] py-3 hover:bg-white/[.03]"
                style={{ background: c.id === selected?.id ? "rgba(63,232,122,.07)" : "transparent" }}
              >
                <div>
                  <div className="text-[13px] font-semibold">{c.name}</div>
                  <div className="text-[11px] text-white/40">
                    {c.kind}
                    {c.date ? ` · ${c.date}` : ""}
                  </div>
                </div>
                <div className="text-[12.5px] text-white/70">{c.counterparty}</div>
                <div className="font-mono text-[12.5px]">{c.value}</div>
                <div className="w-fit rounded-full px-2.5 py-[3px] font-mono text-[10.5px]" style={{ background: s.bg, color: s.color }}>
                  {s.label}
                </div>
              </div>
            );
          })}
          {contracts.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-white/40">No contracts yet.</div>}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {selected &&
            (aiUnlocked ? (
              <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="h-[7px] w-[7px] rounded-full bg-accent" />
                  <span className="text-[12.5px] font-semibold text-accent">AI summary — {selected.name.split(" — ")[1] ?? selected.name}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {summarizeContract(selected.kind, selected.status, selected.value).map((f, i) => (
                    <div key={i} className="flex gap-2.5 text-[12.5px] leading-snug">
                      <span className="flex-none font-mono" style={{ color: f.flag === "✓" ? "#3fe87a" : "#e8983f" }}>
                        {f.flag}
                      </span>
                      <span className="text-white/80">{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-purple/30 bg-purple/[.06] p-4">
                <div className="mb-1 text-[12.5px] font-semibold text-purple">Pilot AI — contract summary</div>
                <div className="text-[12px] leading-relaxed text-white/60">
                  AI risk flags and plain-English summaries unlock on the Touring plan.{" "}
                  <Link href="/app/billing" className="text-accent underline">
                    Upgrade →
                  </Link>
                </div>
              </div>
            ))}

          {selected && <DocumentCard key={selected.id} contract={selected} />}

          <div className="rounded-card border border-border bg-surface px-4 py-[18px]">
            <div className="mb-2.5 text-[14.5px] font-semibold">Renewals coming up</div>
            {renewals.length === 0 && <div className="text-[13px] text-white/40">Nothing on the horizon.</div>}
            {renewals.map((r) => {
              const label = renewLabel(r.renewsAt!);
              const soon = label.includes("days") && parseInt(label) <= 45;
              return (
                <div key={r.id} className="flex items-center justify-between border-b border-white/[.05] py-1.5 last:border-b-0">
                  <div className="text-[13px]">{r.name}</div>
                  <div className="font-mono text-[11px]" style={{ color: soon ? "#e8983f" : "rgba(233,236,232,.5)" }}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const initialUploadState: ActionState = {};

function DocumentCard({ contract }: { contract: ContractDTO }) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadContractDocument, initialUploadState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-[18px]">
      <div className="mb-2.5 text-[14.5px] font-semibold">Document</div>
      {contract.fileName ? (
        <div className="flex items-center gap-2.5">
          <span className="flex-1 truncate text-[12.5px] text-white/80">{contract.fileName}</span>
          <a
            href={`/api/contracts/${contract.id}/document`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded-lg border border-white/15 px-2.5 py-1.5 text-[11.5px] text-white/70 hover:border-white/35"
          >
            View
          </a>
          <button
            onClick={() => startTransition(() => void removeContractDocument(contract.id))}
            className="cursor-pointer px-1 text-[13px] text-white/40 hover:text-orange"
            aria-label="Remove document"
          >
            ×
          </button>
        </div>
      ) : (
        <form ref={formRef} action={uploadAction} className="flex flex-col gap-2">
          <input type="hidden" name="contractId" value={contract.id} />
          <label className="cursor-pointer rounded-[10px] border border-dashed border-white/20 px-3 py-4 text-center text-[12.5px] text-white/50 hover:border-accent/40 hover:text-white/70">
            {uploadPending ? "Uploading…" : "Click to upload a PDF or document"}
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
              onChange={() => formRef.current?.requestSubmit()}
            />
          </label>
          {uploadState.error && <div className="text-[12px] text-orange">{uploadState.error}</div>}
        </form>
      )}
    </div>
  );
}
