"use client";

import { useTransition } from "react";
import { createTour } from "@/lib/actions/tour";

export function NewTourForm() {
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(() => createTour(formData));
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Tour</h1>
      <div className="mb-6 text-[13px] text-text/50">Create a tour, then add your confirmed bookings as stops to get routing and day sheets.</div>
      <form action={submit} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text/50">Tour name</span>
          <input
            name="name"
            required
            placeholder="Fall Run"
            className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Start date</span>
            <input
              name="startDate"
              type="date"
              required
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">End date</span>
            <input
              name="endDate"
              type="date"
              required
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create tour"}
        </button>
      </form>
    </div>
  );
}
