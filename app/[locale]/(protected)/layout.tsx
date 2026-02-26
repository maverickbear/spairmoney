import { Suspense } from "react";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { verifyUserExists } from "@/lib/utils/verify-user-exists";
import { logger } from "@/src/infrastructure/utils/logger";
import { ProtectedDashboardShell } from "@/src/presentation/components/layout/protected-dashboard-shell";
import type { Subscription, Plan } from "@/src/domain/subscriptions/subscriptions.validations";
// CRITICAL: Use static import to ensure React cache() works correctly
import { getDashboardSubscription } from "@/src/application/subscriptions/get-dashboard-subscription";

/**
 * Auth Guard Component - Wrapped in Suspense to prevent blocking page render
 * Handles all authentication and authorization checks
 */
async function AuthGuard({ children }: { children: React.ReactNode }) {
  const log = logger.withPrefix("PROTECTED-LAYOUT");
  
  // Access headers() first to unlock cookie access in createServerClient()
  await headers();
  
  const supabase = await createServerClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
    const href = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
    redirect({ href, locale: await getLocale() });
  }
  const currentUser = user as NonNullable<typeof user>;

  // Portal admins (admin table or users.role super_admin) go to /admin; they don't use consumer app
  const adminService = makeAdminService();
  const isPortalAdmin = await adminService.isSuperAdmin(currentUser.id);
  if (isPortalAdmin) {
    redirect({ href: "/admin", locale: await getLocale() });
  }

  // PERFORMANCE OPTIMIZATION: Combine user verification and data fetching into single query
  let userData: { id: string; isBlocked: boolean; role: string; trialEndsAt: string | null } | null = null;
  try {
    let { data, error: userError } = await supabase
      .from("users")
      .select("id, is_blocked, role, trial_ends_at")
      .eq("id", currentUser.id)
      .single();

    // If user is in Auth but not in User table (e.g. Google OAuth callback never ran or failed),
    // create profile and household now so behavior matches manual signup.
    if ((userError || !data) && currentUser.email) {
      log.info(`[PROTECTED-LAYOUT] User ${currentUser.id} authenticated but not in User table; creating profile and household (same as manual/Google signup).`);
      try {
        const { makeAuthService } = await import("@/src/application/auth/auth.factory");
        const authService = makeAuthService();
        const profileResult = await authService.createUserProfile({
          userId: currentUser.id,
          email: currentUser.email,
          name: (currentUser.user_metadata?.full_name ?? currentUser.user_metadata?.name) ?? null,
          avatarUrl: (currentUser.user_metadata?.avatar_url ?? currentUser.user_metadata?.picture) ?? null,
        });
        if (profileResult.success) {
          const { data: newUser, error: refetchError } = await supabase
            .from("users")
            .select("id, is_blocked, role, trial_ends_at")
            .eq("id", currentUser.id)
            .single();
          if (!refetchError && newUser) {
            data = newUser;
            userError = null;
          }
        }
      } catch (profileError) {
        log.error("Error creating user profile in protected layout:", profileError);
      }
    }

    if (userError || !data) {
      console.warn(`[PROTECTED-LAYOUT] User ${currentUser.id} authenticated but not found in User table. Logging out.`);
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        log.error("Error signing out:", signOutError);
      }
      const headersList = await headers();
      const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
      const href = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
      redirect({ href, locale: await getLocale() });
    }

    userData = {
      id: data!.id,
      isBlocked: data!.is_blocked,
      role: data!.role,
      trialEndsAt: (data as { trial_ends_at?: string | null }).trial_ends_at ?? null,
    };
  } catch (error) {
    log.error("Error fetching user data:", error);
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
    const href = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
    redirect({ href, locale: await getLocale() });
  }

  const userId = userData!.id;

  // Check if user is blocked
  if (userData!.isBlocked) {
    log.debug("User is blocked, redirecting to account blocked page");
    await supabase.auth.signOut();
    redirect({ href: "/account-blocked", locale: await getLocale() });
  }

  // Check maintenance mode
  let isMaintenanceMode = false;
  try {
    const settings = await adminService.getPublicSystemSettings();
    isMaintenanceMode = settings.maintenanceMode || false;
  } catch (error) {
    // If error checking maintenance mode, log but don't block access
    log.error("Error checking maintenance mode:", error);
  }

  if (isMaintenanceMode) {
    // Use already fetched userData instead of querying again
    // If not super_admin, redirect to maintenance page
    // Note: redirect() throws a special error that Next.js uses for navigation
    // We don't catch it here so Next.js can handle it properly
    if (userData?.role !== "super_admin") {
      log.debug("Maintenance mode active, redirecting non-super_admin user to maintenance page");
      redirect({ href: "/maintenance", locale: await getLocale() });
    }
    // super_admin can continue normally
    log.debug("Maintenance mode active, but user is super_admin - allowing access");
  }

  // Check subscription - use SubscriptionsService (single source of truth)
  let shouldOpenModal = false;
  let reason: "no_subscription" | "trial_expired" | "subscription_inactive" | undefined;
  let subscription: Subscription | null = null;
  let plan: Plan | null = null;
  
  try {
    // CRITICAL: Get userId BEFORE calling getDashboardSubscription() to avoid
    // calling cookies() inside a "use cache" function
    // CRITICAL OPTIMIZATION: Use cached function to ensure only 1 call per request
    // This replaces multiple SubscriptionsService calls throughout the app
    // IMPORTANT: Using static import ensures React cache() works correctly
    const subscriptionData = await getDashboardSubscription(userId);
    subscription = subscriptionData.subscription;
    plan = subscriptionData.plan;
    
    // Note: SubscriptionsService already handles household member subscription inheritance
    // No need for manual retry - the service checks household membership internally
    // If no subscription (new user, trial active, or trial ended): never open blocking modal;
    // the trial banner handles the CTA (Subscribe Now or choose monthly/annual when trial ended).
    if (!subscription) {
      shouldOpenModal = false;
      reason = "no_subscription";
    } else {
      // Check if subscription status allows access
      const isActiveStatus = subscription.status === "active";
      const isTrialingStatus = subscription.status === "trialing";
      const isExpiredTrial =
        plan?.id === "trial" &&
        subscription.trialEndDate &&
        new Date(subscription.trialEndDate) <= new Date();

      if (isExpiredTrial) {
        shouldOpenModal = true;
        reason = "trial_expired";
      } else if (isActiveStatus || isTrialingStatus) {
        shouldOpenModal = false;
      } else {
        // Open modal for "cancelled" status (user needs to reactivate)
        if (subscription.status === "cancelled") {
          shouldOpenModal = true;
          reason = "no_subscription"; // Use no_subscription reason to show dialog
        } else if (subscription.status === "past_due") {
          shouldOpenModal = true;
          reason = "subscription_inactive";
        } else if (subscription.status === "unpaid") {
          shouldOpenModal = true;
          reason = "subscription_inactive";
        } else {
          shouldOpenModal = false;
        }
      }
    }
  } catch (error) {
    // If error checking subscription, don't open pricing dialog
    // Let onboarding handle it (user might be new and needs onboarding)
    log.error("Error checking subscription:", error);
    shouldOpenModal = false; // Don't open pricing dialog, let onboarding handle it
  }

  // Get current plan ID and interval for the dialog
  const currentPlanId = subscription?.planId;
  let currentInterval: "month" | "year" | null = null;
  
  // Try to determine interval from subscription if available
  // Note: This is a simplified check - full interval detection requires Stripe API call
  // The dialog will handle fetching the correct interval if needed
  if (subscription && plan) {
    // Default to null - dialog can fetch from API if needed
    currentInterval = null;
  }

  // Determine subscription status for dialog
  const subscriptionStatus: "no_subscription" | "cancelled" | "past_due" | "unpaid" | null =
    !subscription
      ? "no_subscription"
      : subscription.status === "cancelled" || subscription.status === "past_due" || subscription.status === "unpaid"
        ? (subscription.status as "cancelled" | "past_due" | "unpaid")
        : null;

  const trialEndsAt = userData?.trialEndsAt ?? null;

  return (
    <ProtectedDashboardShell
      subscription={subscription}
      plan={plan}
      trialEndsAt={trialEndsAt}
      shouldOpenModal={shouldOpenModal}
      reason={reason}
      currentPlanId={currentPlanId}
      currentInterval={currentInterval}
      subscriptionStatus={subscriptionStatus}
    >
      {children}
    </ProtectedDashboardShell>
  );
}

/**
 * Protected Layout
 *
 * Protects routes that require authentication. It verifies:
 * 1. User is authenticated
 * 2. User exists in User table
 *
 * Subscription requirement: when the user has no active subscription (none, cancelled,
 * past_due, unpaid), the pricing modal is shown and blocks full access until they
 * subscribe or reactivate. Onboarding is hidden until they have a subscription.
 *
 * Uses Suspense to prevent blocking page render while checking authentication.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}

