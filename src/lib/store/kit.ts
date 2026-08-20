import "server-only";

// Kit (formerly ConvertKit) v4. Every function here is best-effort by
// design: the brief is explicit that a Kit outage must never cost a
// subscriber their download, and our own `subscribers` table is the source
// of truth regardless. So nothing in here throws — callers get a boolean and
// carry on.

const API = "https://api.kit.com/v4";

function key() {
  return process.env.KIT_API_KEY ?? "";
}

export function kitConfigured(): boolean {
  return key().length > 0;
}

async function kitFetch(path: string, init: RequestInit): Promise<Response | null> {
  if (!kitConfigured()) return null;
  try {
    return await fetch(`${API}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": key(), ...(init.headers ?? {}) },
      // A slow list provider must not hold a download hostage.
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
}

/** Create or update the subscriber and apply tags. Returns whether Kit accepted it. */
export async function upsertSubscriber(email: string, tags: readonly string[]): Promise<boolean> {
  const created = await kitFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  });
  // 200/201 is created; 422 usually means "already exists", which is fine.
  if (!created || (!created.ok && created.status !== 422)) return false;

  let ok = true;
  for (const tag of tags) {
    const res = await kitFetch(`/tags`, { method: "POST", body: JSON.stringify({ name: tag }) });
    // Creating an existing tag is not an error for our purposes; what matters
    // is the subscribe call below.
    void res;
    const applied = await kitFetch(`/tags/${encodeURIComponent(tag)}/subscribers`, {
      method: "POST",
      body: JSON.stringify({ email_address: email }),
    });
    if (!applied || !applied.ok) ok = false;
  }
  return ok;
}

/** Subscribe to the form that sends the tool's incentive email. */
export async function addToForm(email: string, formId: string | undefined): Promise<boolean> {
  if (!formId) return false;
  const res = await kitFetch(`/forms/${formId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  });
  return Boolean(res?.ok);
}

/** Env var name per tool, so a missing form id is a config gap not a crash. */
export const KIT_FORM_ENV: Record<string, string | undefined> = {
  "booking-pipeline": process.env.KIT_FORM_BOOKING_PIPELINE,
  "tour-checklist": process.env.KIT_FORM_TOUR_CHECKLIST,
  "monthly-check-in": process.env.KIT_FORM_MONTHLY_CHECKIN,
  "budget-spreadsheet": process.env.KIT_FORM_BUDGET_SPREADSHEET,
  "all-tools": process.env.KIT_FORM_ALL_TOOLS,
};
