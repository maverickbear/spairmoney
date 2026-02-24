import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { verifyUserExists } from "@/lib/utils/verify-user-exists";

/**
 * Auth Required Layout
 * 
 * This layout protects routes that require authentication but not subscription.
 * 
 * It verifies:
 * 1. User is authenticated
 * 2. User exists in User table
 * 
 * If user is not authenticated, redirects to /auth/login with redirect parameter
 * If user doesn't exist in User table, logs out and redirects to /auth/login
 * If user is authenticated, allows access (subscription check is handled in the page itself)
 */
export default async function AuthRequiredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Opt out of static generation - this layout requires authentication
  noStore();

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
    const redirectUrl = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
    redirect(redirectUrl);
  }

  const { exists } = await verifyUserExists(user);
  if (!exists) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
    const redirectUrl = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
    redirect(redirectUrl);
  }

  return <>{children}</>;
}

