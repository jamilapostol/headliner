"use client";

import { useState, useTransition } from "react";
import { toggleTask, createTask, deleteTask } from "@/lib/actions/tasks";

type Task = { id: string; title: string; dueLabel: string; done: boolean };

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [dueLabel, setDueLabel] = useState("");

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
            onClick={() => startTransition(() => toggleTask(t.id))}
            className="grid h-[17px] w-[17px] flex-none cursor-pointer place-items-center rounded-[5px] border-[1.5px] text-[11px] font-bold text-canvas"
            style={{ borderColor: t.done ? "#3fe87a" : "rgba(233,236,232,.3)", background: t.done ? "#3fe87a" : "transparent" }}
          >
            {t.done ? "✓" : ""}
          </div>
          <div
            onClick={() => startTransition(() => toggleTask(t.id))}
            className="cursor-pointer text-[13px]"
            style={{ color: t.done ? "rgba(233,236,232,.35)" : "#e9ece8", textDecoration: t.done ? "line-through" : "none" }}
          >
            {t.title}
          </div>
          {t.dueLabel && (
            <div className="ml-auto font-mono text-[10.5px]" style={{ color: t.dueLabel === "today" && !t.done ? "#e8983f" : "rgba(233,236,232,.4)" }}>
              {t.dueLabel}
            </div>
          )}
          <button
            onClick={() => startTransition(() => deleteTask(t.id))}
            className={`cursor-pointer px-1 text-[13px] text-white/30 opacity-0 hover:text-orange group-hover:opacity-100 ${t.dueLabel ? "" : "ml-auto"}`}
            aria-label="Delete task"
          >
            ×
          </button>
        </div>
      ))}

      <div className="mt-1 flex items-center gap-2 border-t border-white/[.06] pt-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-white/30"
        />
        <input
          value={dueLabel}
          onChange={(e) => setDueLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="due"
          className="w-14 flex-none bg-transparent font-mono text-[10.5px] text-white/50 outline-none placeholder:text-white/25"
        />
        <button onClick={add} className="cursor-pointer px-1 text-[15px] text-accent hover:text-accent/70" aria-label="Add task">
          +
        </button>
      </div>
    </div>
  );
}
