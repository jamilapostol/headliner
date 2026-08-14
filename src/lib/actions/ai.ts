"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorState } from "@/lib/action-error";
import { requireMinPlan } from "@/lib/plan-limits-server";
import { aiEnabled, claude, ROADIE_MODEL } from "@/lib/claude";
import { MONTHLY_AI_CAP } from "@/lib/plan-limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { draftFollowupEmail as templateFollowupEmail, summarizeContract as templateContractSummary, type ContractFact } from "@/lib/ai";

// Roadie AI server actions. With ANTHROPIC_API_KEY set these make real Claude
// calls; without it they fall back to the deterministic templates in
// src/lib/ai.ts so the features keep working in demos. Both are gated to
// Touring+ plans — the plan check runs before any paid API call.

// Reserves one Roadie action against the workspace's monthly quota, or
// returns an error string when the cap is reached. Only called before real
// Claude calls — template fallbacks are free and uncounted. The increment
// happens up front (before the API call) so a burst of parallel requests
// can't meaningfully overshoot the cap.
async function consumeAiQuota(workspaceId: string): Promise<string | null> {
  const workspace = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { plan: true } });
  const cap = MONTHLY_AI_CAP[workspace.plan] ?? 0;
  if (cap <= 0) return "Roadie AI requires the Touring plan or higher.";

  const month = new Date().toISOString().slice(0, 7); // "2026-08"
  const usage = await db.aiUsage.upsert({
    where: { workspaceId_month: { workspaceId, month } },
    create: { workspaceId, month, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (usage.count > cap) {
    return `You've used all ${cap} Roadie actions included this month. Your quota resets on the 1st.`;
  }
  return null;
}

function firstText(content: Array<{ type: string; text?: string }>): string {
  for (const block of content) {
    if (block.type === "text" && block.text) return block.text;
  }
  return "";
}

// `fallback: true` means this came from the deterministic template, not from
// Claude. The caller must surface that — an unlabelled template reads as a
// real Roadie result on a plan the user is paying for it on.
export async function generateFollowupDraft(bookingId: string): Promise<{ error?: string; text?: string; fallback?: true }> {
  return withErrorState("generateFollowupDraft", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.workspaceId !== session.workspaceId) return { error: "Booking not found." };

    await requireMinPlan(session.workspaceId, "touring");

    if (!aiEnabled) {
      return {
        fallback: true,
        text: templateFollowupEmail({
          contactName: booking.contactName,
          venue: booking.venue,
          city: booking.city,
          date: booking.date.toISOString(),
          artistName: session.name,
        }),
      };
    }

    const quotaError = await consumeAiQuota(session.workspaceId);
    if (quotaError) return { error: quotaError };

    // Real track record from this workspace — recent confirmed/played shows
    // give the model genuine social proof to cite instead of invented stats.
    const recentShows = await db.booking.findMany({
      where: {
        workspaceId: session.workspaceId,
        id: { not: booking.id },
        stage: { in: ["Confirmed", "Paid"] },
      },
      orderBy: { date: "desc" },
      take: 8,
      select: { venue: true, city: true, date: true, fee: true },
    });

    const workspace = await db.workspace.findUniqueOrThrow({
      where: { id: session.workspaceId },
      select: { name: true },
    });

    const showList = recentShows
      .map((s) => `- ${s.venue}, ${s.city} — ${s.date.toISOString().slice(0, 10)}${s.fee ? ` ($${(s.fee / 100).toLocaleString()} fee)` : ""}`)
      .join("\n");

    const response = await claude().messages.create({
      model: ROADIE_MODEL,
      max_tokens: 16000,
      system:
        "You are Roadie, the booking assistant inside HEADLINE.WORLD, a platform for touring musicians. " +
        "Write a short, professional, warm follow-up email from the artist to a venue contact about a pending booking. " +
        "Ground every claim in the facts provided — never invent ticket counts, attendance numbers, or past shows. " +
        "If recent confirmed shows are provided, you may reference them briefly as track record. " +
        "Keep it under 130 words. Output only the email body (greeting through sign-off), no subject line, no commentary.",
      messages: [
        {
          role: "user",
          content:
            `Artist/act: ${workspace.name} (sender signs as ${session.name})\n` +
            `Booking being followed up on:\n` +
            `- Venue: ${booking.venue}\n` +
            `- City: ${booking.city}\n` +
            `- Date: ${booking.date.toISOString().slice(0, 10)}\n` +
            `- Stage: ${booking.stage}\n` +
            `- Contact name: ${booking.contactName || "(unknown — open with a neutral greeting)"}\n` +
            (booking.fee ? `- Proposed fee: $${(booking.fee / 100).toLocaleString()}\n` : "") +
            (booking.notes ? `- Notes: ${booking.notes}\n` : "") +
            (showList ? `\nRecent confirmed/played shows:\n${showList}\n` : "\nNo prior confirmed shows on record — do not reference a track record.\n") +
            `\nGoal: nudge the contact to confirm the hold.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") return { error: "Roadie couldn't draft this one — try editing the booking notes." };
    const text = firstText(response.content).trim();
    if (!text) return { error: "Roadie returned an empty draft — try again." };
    return { text };
  });
}

const CONTRACT_FACTS_SCHEMA = {
  type: "object",
  properties: {
    facts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          flag: { type: "string", enum: ["✓", "!"] },
          text: { type: "string" },
        },
        required: ["flag", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["facts"],
  additionalProperties: false,
} as const;

export async function generateContractSummary(contractId: string): Promise<{ error?: string; facts?: ContractFact[]; fallback?: true }> {
  return withErrorState("generateContractSummary", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const contract = await db.contract.findUnique({ where: { id: contractId } });
    if (!contract || contract.workspaceId !== session.workspaceId) return { error: "Contract not found." };

    await requireMinPlan(session.workspaceId, "touring");

    if (!aiEnabled) {
      return { fallback: true, facts: templateContractSummary(contract.kind, contract.status, contract.value) };
    }

    const quotaError = await consumeAiQuota(session.workspaceId);
    if (quotaError) return { error: quotaError };

    // If a document is on file, read it from the private bucket and let the
    // model summarize the actual terms. PDFs and images go to Claude natively;
    // Word docs can't be attached, so those fall back to metadata-only.
    type DocBlock =
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
      | { type: "image"; source: { type: "base64"; media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; data: string } };
    let docBlock: DocBlock | null = null;
    if (contract.filePath) {
      const ext = contract.filePath.split(".").pop()?.toLowerCase() ?? "";
      const admin = createAdminClient();
      const { data, error } = await admin.storage.from("contracts").download(contract.filePath);
      if (!error && data && data.size <= 15 * 1024 * 1024) {
        const base64 = Buffer.from(await data.arrayBuffer()).toString("base64");
        if (ext === "pdf") {
          docBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
        } else if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
          const mediaType = (ext === "jpg" ? "image/jpeg" : `image/${ext}`) as "image/png" | "image/jpeg" | "image/webp" | "image/gif";
          docBlock = { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };
        }
      }
    }

    const metadata =
      `Contract metadata from the platform:\n` +
      `- Name: ${contract.name}\n` +
      `- Type: ${contract.kind}\n` +
      `- Counterparty: ${contract.counterparty}\n` +
      `- Stated value: ${contract.value}\n` +
      `- Status: ${contract.status}\n` +
      (contract.signedDate ? `- Signed: ${contract.signedDate.toISOString().slice(0, 10)}\n` : "") +
      (contract.renewsAt ? `- Renews: ${contract.renewsAt.toISOString().slice(0, 10)}\n` : "");

    const instruction = docBlock
      ? `${metadata}\nThe attached document is the contract itself. Summarize its key terms as 3-6 facts. Use flag "✓" for confirmed favorable/neutral terms and "!" for risks the artist should act on — especially radius clauses, cancellation penalties, auto-renewal, exclusivity, payment timing, and missing protections. Quote specifics (distances, dates, dollar amounts) from the document.`
      : `${metadata}\nNo contract document is on file — only the metadata above. Produce 2-4 facts: use "!" to flag what the artist should verify for a ${contract.kind} agreement in status ${contract.status} (radius clauses, cancellation terms, auto-renewal, payment timing), and "✓" only for facts supported by the metadata. Recommend uploading the document for a full review.`;

    const content: Array<DocBlock | { type: "text"; text: string }> = docBlock
      ? [docBlock, { type: "text", text: instruction }]
      : [{ type: "text", text: instruction }];

    const response = await claude().messages.create({
      model: ROADIE_MODEL,
      max_tokens: 16000,
      system:
        "You are Roadie, the contracts assistant inside HEADLINE.WORLD, a platform for touring musicians. " +
        "You review agreements from the artist's side. Be concrete and specific; never invent terms that aren't in the provided material.",
      messages: [{ role: "user", content }],
      output_config: { format: { type: "json_schema", schema: CONTRACT_FACTS_SCHEMA } },
    });

    if (response.stop_reason === "refusal") return { error: "Roadie couldn't review this document." };
    try {
      const parsed = JSON.parse(firstText(response.content)) as { facts: ContractFact[] };
      if (!Array.isArray(parsed.facts) || parsed.facts.length === 0) throw new Error("empty");
      return { facts: parsed.facts };
    } catch {
      return { error: "Roadie's review came back malformed — try again." };
    }
  });
}
