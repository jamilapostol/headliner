import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const contract = await db.contract.findUnique({ where: { id } });
  if (!contract || contract.workspaceId !== session.workspaceId || !contract.filePath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("contracts").createSignedUrl(contract.filePath, 60, {
    download: contract.fileName ?? undefined,
  });
  if (error || !data) return NextResponse.json({ error: "Could not open document." }, { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
