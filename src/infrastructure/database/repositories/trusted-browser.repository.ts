/**
 * Trusted Browser Repository
 * Data access for trusted_browsers table. No business logic.
 */

import { createServerClient } from "../supabase-server";
import { createServiceRoleClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";
import { TRUST_EXPIRY_DAYS } from "@/src/domain/trusted-browser/trusted-browser.constants";

function getExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + TRUST_EXPIRY_DAYS);
  return d.toISOString();
}

/**
 * Upsert a trusted browser for the given user (insert or refresh expires_at).
 * Uses server client so RLS applies (user can only write their own rows).
 */
export async function upsertTrustedBrowser(userId: string, fingerprint: string): Promise<void> {
  const supabase = await createServerClient();
  const expiresAt = getExpiresAt();

  const { error } = await supabase
    .from("trusted_browsers")
    .upsert(
      { user_id: userId, fingerprint, expires_at: expiresAt },
      { onConflict: "user_id,fingerprint" }
    );

  if (error) {
    logger.error("[TrustedBrowserRepository] upsertTrustedBrowser error:", error);
    throw new Error(`Failed to register trusted device: ${error.message}`);
  }
}

/**
 * Check if the given email has a non-expired trusted row for the given fingerprint.
 * Uses service role because this is called from the login flow (unauthenticated).
 */
export async function isTrustedByEmailAndFingerprint(
  email: string,
  fingerprint: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // Resolve user id by email (users table)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (userError || !user?.id) {
    return false;
  }

  const { data: row, error } = await supabase
    .from("trusted_browsers")
    .select("id")
    .eq("user_id", user.id)
    .eq("fingerprint", fingerprint)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    logger.error("[TrustedBrowserRepository] isTrustedByEmailAndFingerprint error:", error);
    return false;
  }

  return !!row;
}
