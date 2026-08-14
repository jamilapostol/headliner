import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Receipts live in a private bucket, so every read goes through this route:
// it proves the caller is signed in and that the transaction belongs to
// their workspace before handing back any bytes.
//
// It streams the image rather than redirecting to the signed URL so the src
// stays same-origin — next/image will only optimize a local path, and a
// signed URL changes on every request, which would defeat its cache anyway.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const transaction = await db.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.workspaceId !== session.workspaceId || !transaction.receiptUrl) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("receipts").download(transaction.receiptUrl);
  if (error || !data) return NextResponse.json({ error: "Could not open receipt." }, { status: 500 });

  return new NextResponse(data.stream(), {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      // Private: this is one workspace's financial record, so no shared or
      // CDN cache should hold it.
      "Cache-Control": "private, max-age=300",
    },
  });
}
