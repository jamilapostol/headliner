"use client";

import { useRef, useState, useTransition } from "react";
import { parseCsv, normalizeHeader } from "@/lib/csv";

export type CsvColumn = { key: string; label: string; required?: boolean; aliases?: string[] };

type Stage =
  | { step: "picker" }
  | { step: "error"; message: string }
  | { step: "preview"; rows: Record<string, string>[]; unmatched: string[] }
  | { step: "done"; imported: number; skipped: number };

export function CsvImportModal({
  entityLabel,
  columns,
  onImport,
}: {
  entityLabel: string;
  columns: CsvColumn[];
  onImport: (rows: Record<string, string>[]) => Promise<{ imported: number; skipped: number }>;
}) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>({ step: "picker" });
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setStage({ step: "picker" });
  }

  async function onFile(file: File) {
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    if (headers.length === 0 || rows.length === 0) {
      setStage({ step: "error", message: "That file has no data rows we could read." });
      return;
    }

    // Map each CSV column header to a known field by normalized name/alias match.
    const headerToKey = new Map<number, string>();
    headers.forEach((h, i) => {
      const norm = normalizeHeader(h);
      const match = columns.find((c) => normalizeHeader(c.key) === norm || normalizeHeader(c.label) === norm || (c.aliases ?? []).some((a) => normalizeHeader(a) === norm));
      if (match && ![...headerToKey.values()].includes(match.key)) headerToKey.set(i, match.key);
    });

    const missingRequired = columns.filter((c) => c.required && ![...headerToKey.values()].includes(c.key));
    if (missingRequired.length > 0) {
      setStage({
        step: "error",
        message: `Couldn't find a column for: ${missingRequired.map((c) => c.label).join(", ")}. Check your header row and try again.`,
      });
      return;
    }

    const mapped = rows.map((r) => {
      const obj: Record<string, string> = {};
      headerToKey.forEach((key, i) => (obj[key] = (r[i] ?? "").trim()));
      return obj;
    });

    const unmatched = headers.filter((_, i) => !headerToKey.has(i));
    setStage({ step: "preview", rows: mapped, unmatched });
  }

  function confirmImport() {
    if (stage.step !== "preview") return;
    const rows = stage.rows;
    startTransition(async () => {
      const result = await onImport(rows);
      setStage({ step: "done", imported: result.imported, skipped: result.skipped });
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg border border-white/15 px-3.5 py-1.5 text-[12.5px] font-semibold text-white/75 hover:border-white/35"
      >
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={close}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-[520px] flex-col rounded-2xl border border-border bg-surface p-6">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[17px] font-semibold">Import {entityLabel} from CSV</div>
              <button onClick={close} className="cursor-pointer px-1 text-[18px] text-white/50 hover:text-text">
                ✕
              </button>
            </div>

            {stage.step === "picker" && (
              <>
                <div className="mb-4 text-[12.5px] text-white/50">
                  First row should be column headers. We&apos;ll try to match them automatically —{" "}
                  <span className="font-semibold text-white/70">{columns.map((c) => c.label).join(", ")}</span>.
                </div>
                <label className="cursor-pointer rounded-[10px] border border-dashed border-white/20 px-3 py-8 text-center text-[12.5px] text-white/50 hover:border-accent/40 hover:text-white/70">
                  Click to choose a .csv file
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onFile(f);
                    }}
                  />
                </label>
              </>
            )}

            {stage.step === "error" && (
              <>
                <div className="mb-4 rounded-lg border border-orange/30 bg-orange-soft px-3.5 py-3 text-[12.5px] text-orange">{stage.message}</div>
                <button
                  onClick={() => setStage({ step: "picker" })}
                  className="cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-white/70"
                >
                  Try another file
                </button>
              </>
            )}

            {stage.step === "preview" && (
              <>
                <div className="mb-3 text-[12.5px] text-white/55">
                  {stage.rows.length} row{stage.rows.length === 1 ? "" : "s"} ready to import.
                  {stage.unmatched.length > 0 && (
                    <span className="text-white/35"> Ignoring unrecognized column{stage.unmatched.length === 1 ? "" : "s"}: {stage.unmatched.join(", ")}.</span>
                  )}
                </div>
                <div className="mb-4 overflow-x-auto rounded-lg border border-white/[.08]">
                  <table className="w-full min-w-[420px] text-[11.5px]">
                    <thead>
                      <tr className="border-b border-white/[.08] bg-surface-nested">
                        {columns
                          .filter((c) => stage.rows[0]?.[c.key] !== undefined)
                          .map((c) => (
                            <th key={c.key} className="px-2.5 py-1.5 text-left font-mono font-normal text-white/45">
                              {c.label}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stage.rows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-b border-white/[.05] last:border-b-0">
                          {columns
                            .filter((c) => stage.rows[0]?.[c.key] !== undefined)
                            .map((c) => (
                              <td key={c.key} className="max-w-[140px] truncate px-2.5 py-1.5 text-white/70">
                                {r[c.key] || "—"}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stage.rows.length > 5 && <div className="px-2.5 py-1.5 text-[10.5px] text-white/35">…and {stage.rows.length - 5} more</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStage({ step: "picker" })} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-white/70">
                    Back
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={pending}
                    className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-canvas disabled:opacity-60"
                  >
                    {pending ? "Importing…" : `Import ${stage.rows.length} row${stage.rows.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              </>
            )}

            {stage.step === "done" && (
              <>
                <div className="mb-4 rounded-lg border border-accent/30 bg-accent-soft px-3.5 py-3 text-[13px] text-accent">
                  Imported {stage.imported} row{stage.imported === 1 ? "" : "s"}.
                  {stage.skipped > 0 && ` Skipped ${stage.skipped} row${stage.skipped === 1 ? "" : "s"} missing a required field.`}
                </div>
                <button onClick={close} className="cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-canvas">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
