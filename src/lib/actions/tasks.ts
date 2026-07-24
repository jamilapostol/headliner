"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function toggleTask(taskId: string) {
  const session = await getSession();
  if (!session) return;

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.workspaceId !== session.workspaceId) return;

  await db.task.update({ where: { id: taskId }, data: { done: !task.done } });
  revalidatePath("/app");
}
