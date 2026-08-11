import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Two-factor enforcement: if the account has a verified TOTP factor but this
// session only passed the password (AAL1 with AAL2 available), everything
// behind requireWorkspace/requireAdmin bounces to the verify step. Sessions
// without an enrolled factor pass straight through — 2FA is opt-in per user.
export async function enforceMfa() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data && data.currentLevel === "aal1" && data.nextLevel === "aal2") {
    redirect("/login/verify");
  }
}
