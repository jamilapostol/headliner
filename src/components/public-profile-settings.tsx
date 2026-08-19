"use client";

import { useActionState, useState } from "react";
import { normalizeSlug, slugError } from "@/lib/public-profile";
import { updatePublicProfile, type PublicProfileState } from "@/lib/actions/public-profile";

const initial: PublicProfileState = {};

// The one place an artist decides whether their dates are public. Off until
// they say otherwise, and explicit about exactly what does and does not
// leave the workspace — "public page" is not self-evidently a promise that
// fees and negotiations stay private.

export function PublicProfileSettings({
  name,
  slug,
  enabled,
  bio,
  confirmedCount,
}: {
  name: string;
  slug: string | null;
  enabled: boolean;
  bio: string | null;
  confirmedCount: number;
}) {
  const [state, action, pending] = useActionState(updatePublicProfile, initial);
  const [on, setOn] = useState(enabled);
  const [slugValue, setSlugValue] = useState(slug ?? normalizeSlug(name));

  const normalized = normalizeSlug(slugValue);
  const localError = on && normalized ? slugError(normalized) : null;

  return (
    <form action={action} className="rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[14.5px] font-semibold">Public tour page</div>
          <div className="max-w-[460px] text-[12.5px] leading-relaxed text-text/50">
            A page anyone can open, listing your confirmed dates, with a calendar fans can subscribe to.
          </div>
        </div>
        <input type="checkbox" name="enabled" checked={on} onChange={(e) => setOn(e.target.checked)} className="sr-only" />
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Public tour page"
          onClick={() => setOn((v) => !v)}
          className={`relative mt-1 h-5 w-9 flex-none cursor-pointer rounded-full transition-colors ${on ? "bg-accent" : "bg-text/15"}`}
        >
          <span className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-ink transition-all ${on ? "left-[19px]" : "left-[3px]"}`} />
        </button>
      </div>

      {on && (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-2.5">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
              <span className="text-[11.5px] text-text/50">Address</span>
              <div className="flex items-center rounded-[10px] border border-border bg-surface-nested px-3 py-2">
                <span className="flex-none font-mono text-[12.5px] text-text/35">/a/</span>
                <input
                  name="slug"
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value)}
                  className="w-full bg-transparent font-mono text-[13px] text-text outline-none"
                />
              </div>
            </label>
          </div>
          {localError && <div className="mt-1.5 text-[12px] text-orange">{localError}</div>}
          {!localError && normalized !== slugValue && (
            <div className="mt-1.5 text-[12px] text-text/45">Will be saved as /a/{normalized}</div>
          )}

          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-[11.5px] text-text/50">Short bio (optional)</span>
            <textarea
              name="bio"
              defaultValue={bio ?? ""}
              rows={2}
              maxLength={500}
              placeholder="One or two lines for people who land here."
              className="rounded-[10px] border border-border bg-surface-nested px-3 py-2 text-[13px] outline-none focus:border-accent/50"
            />
          </label>

          <div className="mt-3.5 rounded-[10px] border border-border bg-surface-nested px-3.5 py-3 text-[12px] leading-relaxed text-text/55">
            <span className="font-semibold text-text">What goes public:</span> venue, city and date of your{" "}
            {confirmedCount} confirmed show{confirmedCount === 1 ? "" : "s"}, plus any ticket links.{" "}
            <span className="font-semibold text-text">What never does:</span> fees, deposits, contacts, notes, and anything not
            yet confirmed — leads and offers stay private.
          </div>
        </>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || Boolean(localError)}
          className="cursor-pointer rounded-[10px] bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state.error && <span className="text-[12.5px] text-orange">{state.error}</span>}
        {state.success && <span className="text-[12.5px] text-accent">{state.success}</span>}
        {enabled && slug && !state.error && (
          <a href={`/a/${slug}`} target="_blank" rel="noreferrer" className="text-[12.5px] text-accent hover:underline">
            View page →
          </a>
        )}
      </div>
    </form>
  );
}
