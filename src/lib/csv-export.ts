export function toCsv(rows: Array<Record<string, string | number>>, columns: Array<{ key: string; label: string }>): string {
  const escape = (v: string) => {
    let s = String(v);
    // A cell starting with =, +, -, or @ is read as a formula by Excel/Sheets
    // when the file is opened — data a customer entered (a contact's notes,
    // a fan's name) shouldn't be able to execute code in their spreadsheet
    // app. Prefixing with a tab neutralizes it while keeping the value visible.
    if (/^[=+\-@]/.test(s)) s = `\t${s}`;
    return /[",\r\n\t]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((r) => columns.map((c) => escape(String(r[c.key] ?? ""))).join(","));
  return [header, ...lines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const BOM = "﻿"; // so Excel opens the file as UTF-8 instead of guessing
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
