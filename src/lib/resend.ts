// Minimal Resend integration for campaign sends. No SDK dependency — Resend's
// REST API is a single POST. Mirrors the stripeEnabled pattern in lib/stripe.ts:
// unset the env var and the feature degrades to "not configured" instead of
// throwing, so campaigns stay usable as drafts without an email provider.
export const resendEnabled = !!process.env.RESEND_API_KEY;

const FROM = process.env.RESEND_FROM_EMAIL || "HEADLINE. <onboarding@resend.dev>";

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!resendEnabled) throw new Error("Resend is not configured (set RESEND_API_KEY).");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
}
