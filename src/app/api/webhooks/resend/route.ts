import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

// Resend delivery/open/click webhook.
//
// Until now openRate and clickRate existed in the schema and were never
// written by anything — the campaigns screen said so honestly rather than
// showing zeros as if they were measurements. This is what fills them in.
//
// Resend signs with Svix. Verifying manually rather than adding the svix
// package: it's an HMAC over "{id}.{timestamp}.{body}", and the whole
// integration is otherwise dependency-free (see lib/resend.ts).

export const dynamic = "force-dynamic";

const TRACKED = new Set(["email.delivered", "email.opened", "email.clicked", "email.bounced", "email.complained"]);

/** Rejects replays: Svix recommends a five-minute tolerance. */
const TOLERANCE_SECONDS = 5 * 60;

function verify(secret: string, id: string, timestamp: string, body: string, signatureHeader: string): boolean {
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  // whsec_<base64>; the bytes after the prefix are the key.
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");

  // The header carries one or more space-separated "v1,<signature>" entries
  // so a secret can be rotated without dropping deliveries mid-swap.
  return signatureHeader.split(" ").some((entry) => {
    const presented = entry.startsWith("v1,") ? entry.slice(3) : entry;
    const a = Buffer.from(presented);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  // No secret means unverifiable events, and an unverified event can set
  // your published engagement numbers. Closed is the safe default.
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const body = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature || !verify(secret, id, timestamp, body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body) as {
    type?: string;
    data?: { to?: string[] | string; tags?: Array<{ name: string; value: string }> | Record<string, string> };
  };
  if (!event.type || !TRACKED.has(event.type)) return new Response("Ignored", { status: 200 });

  // Resend has sent tags as both an array and an object across versions.
  const rawTags = event.data?.tags;
  const campaignId = Array.isArray(rawTags)
    ? rawTags.find((t) => t.name === "campaign_id")?.value
    : rawTags?.campaign_id;
  if (!campaignId) return new Response("No campaign tag", { status: 200 });

  const recipient = Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to;
  if (!recipient) return new Response("No recipient", { status: 200 });

  const type = event.type.replace("email.", "");

  // Unique on (campaign, email, type): a recipient opening six times counts
  // once, and a webhook redelivery is a no-op rather than an inflated rate.
  await db.campaignEvent.upsert({
    where: { campaignId_email_type: { campaignId, email: recipient, type } },
    create: { campaignId, email: recipient, type },
    update: {},
  });

  if (type === "opened" || type === "clicked") {
    const campaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { recipientCount: true } });
    // Rates are only meaningful against a known denominator.
    if (campaign && campaign.recipientCount > 0) {
      const [opens, clicks] = await Promise.all([
        db.campaignEvent.count({ where: { campaignId, type: "opened" } }),
        db.campaignEvent.count({ where: { campaignId, type: "clicked" } }),
      ]);
      await db.campaign.update({
        where: { id: campaignId },
        data: {
          openRate: Math.min(1, opens / campaign.recipientCount),
          clickRate: Math.min(1, clicks / campaign.recipientCount),
        },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
