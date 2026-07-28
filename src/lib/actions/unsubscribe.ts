"use server";

import { db } from "@/lib/db";

// Public, unauthenticated — reached from an email footer link. The fan's
// cuid is unguessable enough for this MVP; revisit with a signed token if
// this needs to withstand a hostile client someday.
export async function unsubscribeFan(fanId: string) {
  await db.fan.updateMany({ where: { id: fanId }, data: { unsubscribed: true } });
}
