"use client";

import { useState, useTransition } from "react";
import { toggleTask, createTask, deleteTask } from "@/lib/actions/tasks";

type Task = { id: string; title: string; dueLabel: string; done: boolean };

export function TaskList({ tasks: tasksProp }: { tasks: Task[] }) {
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [dueLabel, setDueLabel] = useState("");
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const tasks = tasksProp.filter((t) => !deletedIds.has(t.id)).map((t) => (t.id in doneOverride ? { ...t, done: doneOverride[t.id] } : t));

  function toggle(taskId: string, current: boolean) {
    setDoneOverride((o) => ({ ...o, [taskId]: !current }));
    startTransition(async () => {
      await toggleTask(taskId);
      setDoneOverride((o) => Object.fromEntries(Object.entries(o).filter(([id]) => id !== taskId)));
    });
  }

  function remove(taskId: string) {
    setDeletedIds((s) => new Set(s).add(taskId));
    startTransition(() => deleteTask(taskId));
  }

  function add() {
    if (!title.trim()) return;
    startTransition(() => createTask(title, dueLabel));
    setTitle("");
    setDueLabel("");
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <div key={t.id} className="group flex items-center gap-2.5">
          <div
            onClick={() => toggle(t.id, t.done)}
            className="grid h-[17px] w-[17px] flex-none cursor-pointer place-items-center rounded-[5px] border-[1.5px] text-[11px] font-bold text-ink"
            style={{ borderColor: t.done ? "#3FCB86" : "rgba(var(--fg-rgb),.3)", background: t.done ? "#3FCB86" : "transparent" }}
          >
            {t.done ? "✓" : ""}
          </div>
          <div
            onClick={() => toggle(t.id, t.done)}
            className="cursor-pointer text-[13px]"
            style={{ color: t.done ? "rgba(var(--fg-rgb),.35)" : "var(--text)", textDecoration: t.done ? "line-through" : "none" }}
          >
            {t.title}
          </div>
          {t.dueLabel && (
            <div className="ml-auto font-mono text-[10.5px]" style={{ color: t.dueLabel === "today" && !t.done ? "#FF7A2F" : "rgba(var(--fg-rgb),.4)" }}>
              {t.dueLabel}
            </div>
          )}
          <button
            onClick={() => remove(t.id)}
            className={`cursor-pointer px-1 text-[13px] text-text/30 opacity-0 hover:text-orange group-hover:opacity-100 ${t.dueLabel ? "" : "ml-auto"}`}
            aria-label="Delete task"
          >
            ×
          </button>
        </div>
      ))}

      <div className="mt-1 flex items-center gap-2 border-t border-text/[.06] pt-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text/30"
        />
        <input
          value={dueLabel}
          onChange={(e) => setDueLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="due"
          className="w-14 flex-none bg-transparent font-mono text-[10.5px] text-text/50 outline-none placeholder:text-text/25"
        />
        <button onClick={add} className="cursor-pointer px-1 text-[15px] text-accent hover:text-accent/70" aria-label="Add task">
          +
        </button>
      </div>
    </div>
  );
}
