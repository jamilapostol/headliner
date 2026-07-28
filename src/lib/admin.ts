import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return adminEmails().includes(email.toLowerCase());
}

// Server Actions run without the layout gate re-checking, so every admin
// action must call this itself rather than relying on the page having
// already verified access.
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminEmail(session.email)) notFound();
  return session;
}
