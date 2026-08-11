// Minimal Resend integration for campaign sends. No SDK dependency — Resend's
// REST API is a couple of POSTs. Mirrors the stripeEnabled pattern in
// lib/stripe.ts: unset the env var and the feature degrades to "not
// configured" instead of throwing, so campaigns stay usable as drafts
// without an email provider.
export const resendEnabled = !!process.env.RESEND_API_KEY;

const FROM = process.env.RESEND_FROM_EMAIL || "HEADLINE.WORLD <noreply@headline.world>";
const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL || "support@headline.world";

export type OutgoingEmail = { to: string; subject: string; text: string };

export async function sendEmail({ to, subject, text }: OutgoingEmail) {
  if (!resendEnabled) throw new Error("Resend is not configured (set RESEND_API_KEY).");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, text, reply_to: REPLY_TO }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
}

// Batch endpoint takes up to 100 messages per request — a 2,000-recipient
// campaign is 20 HTTP calls instead of 2,000, which keeps the whole send
// inside a single server-action invocation instead of timing out.
const BATCH_SIZE = 100;

export async function sendEmailBatch(messages: OutgoingEmail[]): Promise<{ sent: number; failed: number }> {
  if (!resendEnabled) throw new Error("Resend is not configured (set RESEND_API_KEY).");

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          chunk.map((m) => ({ from: FROM, to: m.to, subject: m.subject, text: m.text, reply_to: REPLY_TO }))
        ),
      });
      if (res.ok) sent += chunk.length;
      else {
        failed += chunk.length;
        console.error("Resend batch failed:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      failed += chunk.length;
      console.error("Resend batch error:", err);
    }
  }
  return { sent, failed };
}
