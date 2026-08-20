"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", next === "light" ? "#F7F1E6" : "#0B0A0E");
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="mb-1 text-[14.5px] font-semibold">Appearance</div>
      <div className="mb-4 text-[12.5px] text-text/50">Choose how HEADLINE.WORLD looks on this device.</div>
      <div className="flex gap-2">
        {(
          [
            { key: "dark", label: "Dark" },
            { key: "light", label: "Light" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setTheme(opt.key)}
            className="cursor-pointer rounded-[10px] px-4 py-2 text-[12.5px] font-semibold"
            style={{
              border: `1px solid ${theme === opt.key ? "#3FCB86" : "var(--border)"}`,
              background: theme === opt.key ? "rgba(63,203,134,.1)" : "transparent",
              color: theme === opt.key ? "#3FCB86" : "rgba(var(--fg-rgb),.7)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
