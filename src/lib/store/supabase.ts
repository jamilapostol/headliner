import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for the Artist Operator store tables and the private
// file bucket. Those tables have RLS on and NO policies, so service-role is
// the only way in — which is the point: nothing reaches them from a browser.
//
// "server-only" is load-bearing here, not decoration. This key can read and
// write every row in the project; importing this module from a client
// component must fail the build rather than ship the key in a bundle.

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const PRODUCTS_BUCKET = process.env.SUPABASE_PRODUCTS_BUCKET ?? "artist-operator-files";

export function storeClient() {
  if (!url || !serviceRole) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the store.");
  }
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

/** Seconds in seven days — the brief's expiry for delivered download links. */
export const DOWNLOAD_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Signed URLs for a product's files.
 *
 * Returns one entry per file with `url: null` where signing failed, rather
 * than throwing — a bundle whose zip is missing should still deliver the
 * files that do exist, and the caller can report the gap instead of the
 * buyer receiving nothing at all.
 */
export async function signProductFiles(paths: readonly string[]): Promise<Array<{ path: string; url: string | null }>> {
  const supabase = storeClient();
  return Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage.from(PRODUCTS_BUCKET).createSignedUrl(path, DOWNLOAD_TTL_SECONDS);
      return { path, url: error ? null : (data?.signedUrl ?? null) };
    })
  );
}
