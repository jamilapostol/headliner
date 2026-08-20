import "server-only";

// The delivery email, per setup/delivery-email.md — used verbatim, including
// the per-product-type variant of paragraph 2. Plain text with a minimal
// HTML twin: deliverability over design on transactional mail, no images and
// no buttons.

export type DeliveryFile = { name: string; signedUrl: string };

type Variant = "pack" | "bundle" | "contract-vault" | "xlsx";

export function deliveryVariant(slug: string, format?: string, type?: string): Variant {
  if (slug === "contract-vault") return "contract-vault";
  if (format === "XLSX") return "xlsx";
  if (type === "bundle") return "bundle";
  return "pack";
}

const PARAGRAPH_TWO: Record<Variant, string> = {
  pack:
    "**This pack works best on paper.** Print it, put it where the work happens, and write in it. A worksheet on a screen is a suggestion; a worksheet with pen marks on it is an operation.",
  "contract-vault":
    "**Read `00-READ-THIS-FIRST.pdf` before you send anything.** It covers the rules of paper — and remember these are templates, not legal advice; anything with real money or exclusivity in it deserves a lawyer who knows your territory.",
  xlsx:
    "**Open it in Excel, Numbers, or Google Sheets.** Yellow cells with blue text are yours to edit; everything else calculates. Start with The Split tab.",
  bundle:
    "**Start with the Six Jobs Audit.** It tells you which of the other twelve packs your career needs first. The rest will still be there when the audit says so.",
};

/** `**bold**` → <strong>, and nothing else — the copy uses no other markup. */
function inlineHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildDeliveryEmail(opts: { productTitle: string; files: DeliveryFile[]; variant: Variant }) {
  const { productTitle, files, variant } = opts;
  const subject = `Your ${productTitle} — download inside`;

  const fileLinesText = files.map((f) => `→ ${f.name}\n   ${f.signedUrl}`).join("\n\n");

  const text = `Hey —

Thank you. Your copy of ${productTitle} is ready:

${fileLinesText}

Two things worth knowing:

1. Save the files somewhere real. These links work for 7 days — the files are yours forever, the links aren't. If a link expires before you get to it, just reply to this email and I'll send a fresh one.

2. ${PARAGRAPH_TWO[variant].replace(/\*\*/g, "")}

If anything's broken — wrong file, dead link, purchase trouble — reply to this email and a human (me) will fix it.

Go build the machine behind the music.

— Jamil

THE ARTIST OPERATOR · HEADLINE.WORLD
Book it. Run it. Own it.`;

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:#111">
<p>Hey —</p>
<p>Thank you. Your copy of <strong>${escapeHtml(productTitle)}</strong> is ready:</p>
<p>${files
    .map((f) => `→ <a href="${escapeHtml(f.signedUrl)}">${escapeHtml(f.name)}</a>`)
    .join("<br>")}</p>
<p>Two things worth knowing:</p>
<p>1. <strong>Save the files somewhere real.</strong> These links work for 7 days — the files are yours forever, the links aren't. If a link expires before you get to it, just reply to this email and I'll send a fresh one.</p>
<p>2. ${inlineHtml(PARAGRAPH_TWO[variant])}</p>
<p>If anything's broken — wrong file, dead link, purchase trouble — reply to this email and a human (me) will fix it.</p>
<p>Go build the machine behind the music.</p>
<p>— Jamil</p>
<p style="font-size:13px;color:#555">THE ARTIST OPERATOR · HEADLINE.WORLD<br>Book it. Run it. Own it.</p>
</div>`;

  return { subject, text, html };
}

/**
 * Sends the delivery email.
 *
 * Deliberately not routed through lib/resend.ts's sendEmail: that one is the
 * campaign sender, hardcodes the marketing From and reply-to, and supports
 * neither an HTML part nor an idempotency key. Both matter here — the key is
 * the session id, mirroring the webhook's own gate so a Stripe retry that
 * slips past the order insert still cannot send a second copy.
 *
 * Same direct-fetch convention as the rest of this codebase's integrations;
 * no SDK added for one call.
 */
export async function sendDeliveryEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
}): Promise<{ ok: boolean; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, detail: "RESEND_API_KEY not set" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": opts.idempotencyKey,
      },
      body: JSON.stringify({
        from: process.env.DELIVERY_FROM_EMAIL || "orders@headline.world",
        to: opts.to,
        reply_to: "support@headline.world",
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }),
    });
    if (!res.ok) return { ok: false, detail: `${res.status} ${await res.text().catch(() => "")}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: String(err) };
  }
}
