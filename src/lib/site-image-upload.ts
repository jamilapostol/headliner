import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedImage } from "@/lib/file-validation";

const BUCKET = "site-content";

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: true });
  // Ignore "already exists" — this just means a previous upload already
  // provisioned it. Any other error should surface to the caller.
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

// Shared by site-content image fields (hero photo, etc.) and landing blocks
// — both are admin-only, publicly-served marketing images, so one bucket
// and one validation path covers both.
export async function uploadSiteImage(file: File, pathPrefix: string): Promise<{ url?: string; error?: string }> {
  if (!file || file.size === 0) return { error: "Choose an image first." };
  if (file.size > 8 * 1024 * 1024) return { error: "Image must be under 8MB." };
  if (!isAllowedImage(file)) return { error: "Please upload a JPG, PNG, GIF, or WEBP image." };

  const admin = createAdminClient();
  await ensureBucket(admin);

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pathPrefix}-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl };
}
