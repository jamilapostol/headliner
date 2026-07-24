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

export async function createTask(title: string, dueLabel: string) {
  const session = await getSession();
  if (!session) return;
  if (!title.trim()) return;

  await db.task.create({
    data: { workspaceId: session.workspaceId, title: title.trim(), dueLabel: dueLabel.trim() },
  });
  revalidatePath("/app");
}

export async function deleteTask(taskId: string) {
  const session = await getSession();
  if (!session) return;

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.workspaceId !== session.workspaceId) return;

  await db.task.delete({ where: { id: taskId } });
  revalidatePath("/app");
}
