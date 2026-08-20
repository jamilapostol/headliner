"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { planUnlocksAI, type ContractFact } from "@/lib/ai";
import { createContract, updateContract, uploadContractDocument, removeContractDocument, type ActionState } from "@/lib/actions/contracts";
import { generateContractSummary } from "@/lib/actions/ai";

const KINDS = ["Performance", "Sponsorship", "Licensing", "Insurance", "Work-for-hire", "Other"] as const;

export type ContractDTO = {
  id: string;
  name: string;
  kind: string;
  counterparty: string;
  value: string;
  status: "DRAFT" | "AWAITING_SIGN" | "SIGNED" | "ACTIVE";
  date: string | null;
  signedDate: string | null;
  renewsAt: string | null;
  fileName: string | null;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  SIGNED: { bg: "rgba(63,203,134,.1)", color: "#3FCB86", label: "SIGNED" },
  ACTIVE: { bg: "rgba(63,203,134,.1)", color: "#3FCB86", label: "ACTIVE" },
  AWAITING_SIGN: { bg: "rgba(255,201,60,.1)", color: "#FFC93C", label: "AWAITING SIGN" },
  DRAFT: { bg: "rgba(var(--border-rgb),.06)", color: "rgba(var(--fg-rgb),.5)", label: "DRAFT" },
};

function renewLabel(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 45) return `${days} days left`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function ContractsView({ contracts, plan }: { contracts: ContractDTO[]; plan: string }) {
  const [selId, setSelId] = useState(contracts[0]?.id ?? null);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<ContractDTO | null>(null);
  const selected = contracts.find((c) => c.id === selId) ?? contracts[0];
  const aiUnlocked = planUnlocksAI(plan);
  const renewals = contracts.filter((c) => c.renewsAt).sort((a, b) => new Date(a.renewsAt!).getTime() - new Date(b.renewsAt!).getTime());

  const [summary, setSummary] = useState<{ contractId: string; facts: ContractFact[]; fallback?: true } | null>(null);
  useEffect(() => {
    if (!aiUnlocked || !selected) return;
    let cancelled = false;
    generateContractSummary(selected.id).then((result) => {
      if (!cancelled && result?.facts) setSummary({ contractId: selected.id, facts: result.facts, fallback: result.fallback });
    });
    return () => {
      cancelled = true;
    };
  }, [aiUnlocked, selected]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Contracts</h1>
        <button onClick={() => setShowNew(true)} className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink">
          + New contract
        </button>
      </div>
      <div className="mb-[18px] text-[13px] text-text/50">Agreements, riders and renewals.</div>

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <div className="min-w-[680px]">
          <div className="grid grid-cols-[1.8fr_.9fr_.7fr_.9fr_1.3fr_auto] gap-3 border-b border-border px-[18px] py-[11px] font-label text-[10.5px] tracking-[.1em] text-text/40">
            <div>AGREEMENT</div>
            <div>COUNTERPARTY</div>
            <div>VALUE</div>
            <div>STATUS</div>
            <div>DOCUMENT</div>
            <div />
          </div>
          {contracts.map((c) => (
            <ContractRow key={c.id} contract={c} selected={c.id === selected?.id} onSelect={() => setSelId(c.id)} onEdit={() => setEditing(c)} />
          ))}
          {contracts.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No contracts yet.</div>}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {selected &&
            (aiUnlocked ? (
              <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="h-[7px] w-[7px] rounded-full bg-accent" />
                  <span className="text-[12.5px] font-semibold text-accent">
                    {summary?.contractId === selected.id && summary.fallback ? "What to check" : "AI summary"} — {selected.name.split(" — ")[1] ?? selected.name}
                  </span>
                </div>
                {summary?.contractId === selected.id && summary.fallback && (
                  <div className="mb-2.5 rounded-lg border border-orange/25 bg-orange/[.06] px-2.5 py-2 text-[12px] leading-relaxed text-text/75">
                    Roadie isn&rsquo;t connected right now, so this document hasn&rsquo;t been read. These are the terms worth checking yourself for this kind of agreement.
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {summary && summary.contractId === selected.id ? (
                    summary.facts.map((f, i) => (
                      <div key={i} className="flex gap-2.5 text-[12.5px] leading-snug">
                        <span className="flex-none font-mono" style={{ color: f.flag === "✓" ? "#3FCB86" : "#FF7A2F" }}>
                          {f.flag}
                        </span>
                        <span className="text-text/80">{f.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[12px] text-text/40">Loading summary…</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-purple/30 bg-purple/[.06] p-4">
                <div className="mb-1 text-[12.5px] font-semibold text-purple">Roadie AI — contract summary</div>
                <div className="text-[12px] leading-relaxed text-text/60">
                  AI risk flags and plain-English summaries unlock on the Touring plan.{" "}
                  <Link href="/app/billing" className="text-accent underline">
                    Upgrade →
                  </Link>
                </div>
              </div>
            ))}

          <div className="rounded-card border border-border bg-surface px-4 py-[18px]">
            <div className="mb-2.5 text-[14.5px] font-semibold">Renewals coming up</div>
            {renewals.length === 0 && <div className="text-[13px] text-text/40">Nothing on the horizon.</div>}
            {renewals.map((r) => {
              const label = renewLabel(r.renewsAt!);
              const soon = label.includes("days") && parseInt(label) <= 45;
              return (
                <div key={r.id} className="flex items-center justify-between border-b border-text/[.05] py-1.5 last:border-b-0">
                  <div className="text-[13px]">{r.name}</div>
                  <div className="font-mono text-[11px]" style={{ color: soon ? "#FF7A2F" : "rgba(var(--fg-rgb),.5)" }}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showNew && (
        <ContractFormModal
          title="New contract"
          submitLabel="Add contract"
          onSubmit={createContract}
          onClose={() => setShowNew(false)}
        />
      )}

      {editing && (
        <ContractFormModal
          title="Edit contract"
          submitLabel="Save"
          initial={editing}
          onSubmit={(fd) => updateContract(editing.id, fd)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const initialUploadState: ActionState = {};

function ContractRow({
  contract,
  selected,
  onSelect,
  onEdit,
}: {
  contract: ContractDTO;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const s = STATUS_STYLE[contract.status];

  return (
    <div
      className="grid grid-cols-[1.8fr_.9fr_.7fr_.9fr_1.3fr_auto] items-center gap-3 border-b border-text/[.05] px-[18px] py-3 hover:bg-text/[.03]"
      style={{ background: selected ? "rgba(63,203,134,.07)" : "transparent" }}
    >
      <div className="cursor-pointer" onClick={onSelect}>
        <div className="text-[13px] font-semibold">{contract.name}</div>
        <div className="text-[11px] text-text/40">
          {contract.kind}
          {contract.date ? ` · ${contract.date}` : ""}
        </div>
      </div>
      <div className="cursor-pointer text-[12.5px] text-text/70" onClick={onSelect}>
        {contract.counterparty}
      </div>
      <div className="cursor-pointer font-mono text-[12.5px]" onClick={onSelect}>
        {contract.value}
      </div>
      <div className="w-fit cursor-pointer rounded-full px-2.5 py-[3px] font-mono text-[10.5px]" onClick={onSelect} style={{ background: s.bg, color: s.color }}>
        {s.label}
      </div>
      <DocumentCell contract={contract} />
      <button onClick={onEdit} className="cursor-pointer text-[11.5px] text-text/50 hover:text-accent">
        Edit
      </button>
    </div>
  );
}

function DocumentCell({ contract }: { contract: ContractDTO }) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadContractDocument, initialUploadState);
  const [removePending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (contract.fileName) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={`/api/contracts/${contract.id}/document`}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer truncate text-[12px] text-accent hover:underline"
          title={contract.fileName}
        >
          {contract.fileName}
        </a>
        <button
          disabled={removePending}
          onClick={() => startTransition(() => void removeContractDocument(contract.id))}
          className="cursor-pointer text-[13px] text-text/40 hover:text-orange disabled:opacity-50"
          aria-label="Remove document"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={uploadAction}>
      <input type="hidden" name="contractId" value={contract.id} />
      <label className="cursor-pointer text-[11.5px] text-text/45 hover:text-accent">
        {uploadPending ? "Uploading…" : "+ Upload"}
        <input type="file" name="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={() => formRef.current?.requestSubmit()} />
      </label>
      {uploadState.error && <div className="text-[11px] text-orange">{uploadState.error}</div>}
    </form>
  );
}

function ContractFormModal({
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: {
  title: string;
  submitLabel: string;
  initial?: ContractDTO;
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      await onSubmit(formData);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 text-[17px] font-semibold">{title}</div>
        <form action={submit} className="flex flex-col gap-3">
          <Field label="Name" name="name" placeholder="Performance agreement — The Bluebird" defaultValue={initial?.name} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Kind</span>
            <select
              name="kind"
              defaultValue={initial?.kind ?? "Performance"}
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <Field label="Counterparty" name="counterparty" placeholder="J. Reyes" defaultValue={initial?.counterparty} />
          <Field label="Value" name="value" placeholder="$1,800" defaultValue={initial?.value} />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text/50">Status</span>
              <select
                name="status"
                defaultValue={initial?.status ?? "DRAFT"}
                className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
              >
                {["DRAFT", "AWAITING_SIGN", "SIGNED", "ACTIVE"].map((s) => (
                  <option key={s} value={s}>
                    {STATUS_STYLE[s].label}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Signed (optional)" name="signedDate" type="date" defaultValue={initial?.signedDate?.slice(0, 10)} />
          </div>
          <Field label="Renews (optional)" name="renewsAt" type="date" defaultValue={initial?.renewsAt?.slice(0, 10)} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-60">
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={type !== "date"}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}
