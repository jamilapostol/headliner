"use client";

import { useTransition } from "react";
import { toggleTask } from "@/lib/actions/tasks";

type Task = { id: string; title: string; dueLabel: string; done: boolean };

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <div
          key={t.id}
          onClick={() => startTransition(() => toggleTask(t.id))}
          className="flex cursor-pointer items-center gap-2.5"
        >
          <div
            className="grid h-[17px] w-[17px] flex-none place-items-center rounded-[5px] border-[1.5px] text-[11px] font-bold text-canvas"
            style={{ borderColor: t.done ? "#3fe87a" : "rgba(233,236,232,.3)", background: t.done ? "#3fe87a" : "transparent" }}
          >
            {t.done ? "✓" : ""}
          </div>
          <div className="text-[13px]" style={{ color: t.done ? "rgba(233,236,232,.35)" : "#e9ece8", textDecoration: t.done ? "line-through" : "none" }}>
            {t.title}
          </div>
          <div className="ml-auto font-mono text-[10.5px]" style={{ color: t.dueLabel === "today" && !t.done ? "#e8983f" : "rgba(233,236,232,.4)" }}>
            {t.dueLabel}
          </div>
        </div>
      ))}
    </div>
  );
}
