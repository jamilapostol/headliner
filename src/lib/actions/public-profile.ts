"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorState } from "@/lib/action-error";
import { normalizeSlug, slugError } from "@/lib/public-profile";

export type PublicProfileState = { error?: string; success?: string };

/**
 * Turn the public listing on or off, and set its address.
 *
 * Enabling requires a slug in the same step: a workspace marked public with
 * no address is a state where the artist believes they have published
 * something and nothing is reachable.
 */
export async function updatePublicProfile(_prev: PublicProfileState, formData: FormData): Promise<PublicProfileState> {
  return withErrorState("updatePublicProfile", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const enabled = formData.get("enabled") === "on";
    const slug = normalizeSlug(String(formData.get("slug") ?? ""));
    const bio = String(formData.get("bio") ?? "").trim().slice(0, 500);

    if (!enabled) {
      // Keep the slug on the row so turning the page back on later returns
      // the same address — a link an artist has already shared should not
      // rot because they paused the listing for a week.
      await db.workspace.update({ where: { id: session.workspaceId }, data: { publicEnabled: false, publicBio: bio || null } });
      revalidatePath("/app/account");
      return { success: "Public page is off." };
    }

    const invalid = slugError(slug);
    if (invalid) return { error: invalid };

    const taken = await db.workspace.findFirst({
      where: { publicSlug: slug, id: { not: session.workspaceId } },
      select: { id: true },
    });
    if (taken) return { error: "That address is already taken." };

    await db.workspace.update({
      where: { id: session.workspaceId },
      data: { publicSlug: slug, publicEnabled: true, publicBio: bio || null },
    });
    revalidatePath("/app/account");
    revalidatePath(`/a/${slug}`);
    return { success: `Live at /a/${slug}` };
  });
}
