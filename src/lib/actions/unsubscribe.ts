"use server";

import { db } from "@/lib/db";
import { verifyFanToken } from "@/lib/unsubscribe-token";
import { withErrorLog } from "@/lib/action-error";

// Public, unauthenticated — reached from an email footer link. Requires the
// signed token appended to the link (see src/lib/unsubscribe-token.ts) so a
// leaked or guessed fan id alone can't unsubscribe someone else's fan.
export async function unsubscribeFan(fanId: string, token: string) {
  return withErrorLog("unsubscribeFan", async () => {
    if (!verifyFanToken(fanId, token)) return;
    await db.fan.updateMany({ where: { id: fanId }, data: { unsubscribed: true } });
  });
}
