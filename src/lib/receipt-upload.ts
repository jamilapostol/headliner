import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedImage } from "@/lib/file-validation";

const BUCKET = "receipts";

// Receipts are financial records, so the bucket is private — same treatment
// as contracts. Nothing reads them by public URL; they're served through
// /api/transactions/[id]/receipt, which checks the session and the
// workspace before signing a short-lived URL.
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: false });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

// Optional — a transaction is valid with no receipt, so callers treat a
// missing/empty file as "skip upload" rather than an error.
//
// Returns the object's path within the private bucket, not a URL. The
// Transaction.receiptUrl column stores that path (the name predates the
// switch to a private bucket); anything rendering it must go through the
// API route rather than using it as an image src directly.
export async function uploadReceiptImage(file: File | null, workspaceId: string): Promise<{ path?: string; error?: string }> {
  if (!file || file.size === 0) return {};
  if (file.size > 8 * 1024 * 1024) return { error: "Receipt image must be under 8MB." };
  if (!isAllowedImage(file)) return { error: "Please upload a JPG, PNG, GIF, or WEBP image." };

  const admin = createAdminClient();
  await ensureBucket(admin);

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${workspaceId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };

  return { path };
}
