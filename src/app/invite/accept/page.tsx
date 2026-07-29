import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AcceptInviteForm } from "@/components/accept-invite-form";

export default async function AcceptInvitePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.membershipAccepted) redirect("/app");

  const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center bg-canvas px-6 py-10 text-text" data-theme="dark">
      <h1 className="mb-1.5 text-[24px] tracking-[-.02em]">Join {workspace.name}</h1>
      <div className="mb-6 text-[13.5px] text-white/55">Set a password to finish joining as {session.email}.</div>
      <AcceptInviteForm />
    </div>
  );
}
