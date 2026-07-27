"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import { toCsv, downloadCsv } from "@/lib/csv-export";

export function AnalyticsCsvExport({
  stats,
  monthlyBars,
  bestCities,
  funnel,
}: {
  stats: Array<{ label: string; value: string }>;
  monthlyBars: Array<{ label: string; performance: number; merch: number }>;
  bestCities: Array<[string, number]>;
  funnel: Array<{ label: string; n: number }>;
}) {
  function exportCsv() {
    const sections = [
      { title: "Summary", csv: toCsv(stats, [{ key: "label", label: "Metric" }, { key: "value", label: "Value" }]) },
      {
        title: "Monthly Revenue",
        csv: toCsv(
          monthlyBars.map((b) => ({ label: b.label, performance: (b.performance / 100).toFixed(2), merch: (b.merch / 100).toFixed(2) })),
          [
            { key: "label", label: "Month" },
            { key: "performance", label: "Performance ($)" },
            { key: "merch", label: "Merch ($)" },
          ]
        ),
      },
      {
        title: "Best Cities",
        csv: toCsv(
          bestCities.map(([city, total]) => ({ city, total: (total / 100).toFixed(2) })),
          [
            { key: "city", label: "City" },
            { key: "total", label: "Total ($)" },
          ]
        ),
      },
      {
        title: "Booking Funnel",
        csv: toCsv(
          funnel.map((f) => ({ label: f.label, n: f.n })),
          [
            { key: "label", label: "Stage" },
            { key: "n", label: "Count" },
          ]
        ),
      },
    ];

    const csv = sections.map((s) => `${s.title}\r\n${s.csv}`).join("\r\n\r\n");
    downloadCsv("analytics.csv", csv);
  }

  return <ExportCsvButton onClick={exportCsv} />;
}
