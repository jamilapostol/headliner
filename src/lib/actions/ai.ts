"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorState } from "@/lib/action-error";
import { requireMinPlan } from "@/lib/plan-limits-server";
import { draftFollowupEmail as renderFollowupEmail, summarizeContract as renderContractSummary, type ContractFact } from "@/lib/ai";

// Roadie AI's UI-level gate (planUnlocksAI) only ever hid the button — the
// template functions in src/lib/ai.ts were plain exports bundled straight
// into client components, callable from the browser console regardless of
// plan. Wrapping them in real server actions with a plan check here closes
// that gap; it doesn't matter today since the output is templated text, not
// a paid external API call, but it will the moment these are swapped for
// real Claude calls per the comment in ai.ts.

export async function generateFollowupDraft(bookingId: string): Promise<{ error?: string; text?: string }> {
  return withErrorState("generateFollowupDraft", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.workspaceId !== session.workspaceId) return { error: "Booking not found." };

    await requireMinPlan(session.workspaceId, "touring");

    const text = renderFollowupEmail({
      contactName: booking.contactName,
      venue: booking.venue,
      city: booking.city,
      date: booking.date.toISOString(),
      artistName: session.name,
    });
    return { text };
  });
}

export async function generateContractSummary(contractId: string): Promise<{ error?: string; facts?: ContractFact[] }> {
  return withErrorState("generateContractSummary", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const contract = await db.contract.findUnique({ where: { id: contractId } });
    if (!contract || contract.workspaceId !== session.workspaceId) return { error: "Contract not found." };

    await requireMinPlan(session.workspaceId, "touring");

    const facts = renderContractSummary(contract.kind, contract.status, contract.value);
    return { facts };
  });
}
