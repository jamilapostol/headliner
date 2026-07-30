import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export function envAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// The env var is the bootstrap allowlist (can't be locked out by a bad DB
// state); the AdminUser table is what the admin panel itself manages —
// either grants access.
export async function isAdminEmail(email: string) {
  const lower = email.toLowerCase();
  if (envAdminEmails().includes(lower)) return true;
  const row = await db.adminUser.findUnique({ where: { email: lower } });
  return row !== null;
}

// Server Actions run without the layout gate re-checking, so every admin
// action must call this itself rather than relying on the page having
// already verified access.
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await isAdminEmail(session.email))) notFound();
  return session;
}
