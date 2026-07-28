"use client";

import { useRef, useTransition } from "react";
import { createBooking } from "@/lib/actions/bookings";

export function NewBookingForm({ onClose }: { onClose: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      await createBooking(formData);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6"
      >
        <div className="mb-4 text-[17px] font-semibold">New booking</div>
        <form ref={formRef} action={submit} className="flex flex-col gap-3">
          <Field label="Venue" name="venue" placeholder="The Bluebird" />
          <Field label="City" name="city" placeholder="Denver, CO" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" name="date" type="date" />
            <Field label="End date (optional)" name="endDate" type="date" required={false} />
          </div>
          <Field label="Fee ($)" name="fee" type="number" placeholder="1800" />
          <Field label="Contact" name="contactName" placeholder="J. Reyes" required={false} />
          <Field label="Contact phone (optional)" name="contactPhone" type="tel" placeholder="(303) 555-0142" required={false} />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add booking"}
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
  required = true,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}
