import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { makeSubscriptionsService } from "@/src/application/subscriptions/subscriptions.factory";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { makeMembersService } from "@/src/application/members/members.factory";
import { verifyUserExists } from "@/lib/utils/verify-user-exists";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { logger } from "@/src/infrastructure/utils/logger";
import type { Subscription, Plan } from "@/src/domain/subscriptions/subscriptions.validations";

/**
 * Protected Layout
 * 
 * This layout protects routes that require both authentication and subscription.
 * It verifies:
 * 1. User is authenticated
 * 2. User exists in User table
 * 3. User has an active subscription (at least "free" plan)
 * 
 * If user is not authenticated, redirects to /auth/login with redirect parameter
 * If user doesn't exist in User table, logs out and redirects to /auth/login
 * If user is authenticated but has no subscription, redirects to pricing page
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const log = logger.withPrefix("PROTECTED-LAYOUT");
  const supabase = await createServerClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    // Get current pathname for redirect
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
    const redirectUrl = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
    redirect(redirectUrl);
  }

  // PERFORMANCE OPTIMIZATION: Combine user verification and data fetching into single query
  // This avoids multiple sequential queries to the User table
  let userData: { id: string; isBlocked: boolean; role: string } | null = null;
  try {
    const { data, error: userError } = await supabase
      .from("User")
      .select("id, isBlocked, role")
      .eq("id", user.id)
      .single();

    if (userError || !data) {
      // User doesn't exist in User table, log out
      console.warn(`[PROTECTED-LAYOUT] User ${user.id} authenticated but not found in User table. Logging out.`);
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        log.error("Error signing out:", signOutError);
      }
      const headersList = await headers();
      const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
      const redirectUrl = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
      redirect(redirectUrl);
    }

    userData = data;
  } catch (error) {
    log.error("Error fetching user data:", error);
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
    const redirectUrl = pathname ? `/auth/login?redirect=${encodeURIComponent(pathname)}` : "/auth/login";
    redirect(redirectUrl);
  }

  const userId = userData.id;

  // Check if user is blocked
  if (userData.isBlocked && userData.role !== "super_admin") {
    log.debug("User is blocked, redirecting to account blocked page");
    // Sign out the user
    await supabase.auth.signOut();
    redirect("/account-blocked");
  }

  // Check maintenance mode
  let isMaintenanceMode = false;
  try {
    const adminService = makeAdminService();
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
      redirect("/maintenance");
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
    // Get subscription data using SubscriptionsService (already has internal caching)
    // Note: We don't invalidate cache here to avoid performance issues
    // If subscription is not found, it may be a real issue or cache problem
    const subscriptionsService = makeSubscriptionsService();
    const subscriptionData = await subscriptionsService.getCurrentUserSubscriptionData();
    subscription = subscriptionData.subscription;
    plan = subscriptionData.plan;
    
    log.debug("Subscription check result:", {
      hasSubscription: !!subscription,
      subscriptionId: subscription?.id,
      planId: subscription?.planId,
      status: subscription?.status,
      userId: userId,
      hasPlan: !!plan,
      planIdFromPlan: plan?.id,
    });
    
    // If no subscription found, try to invalidate cache and check again
    // This handles cases where cache might be stale
    if (!subscription && userId) {
      log.debug("No subscription found in first attempt, invalidating cache and retrying");
      subscriptionsService.invalidateSubscriptionCache(userId);
      const retryData = await subscriptionsService.getCurrentUserSubscriptionData();
      subscription = retryData.subscription;
      plan = retryData.plan;
      
      log.debug("Subscription check result after cache invalidation:", {
        hasSubscription: !!subscription,
        subscriptionId: subscription?.id,
        planId: subscription?.planId,
        status: subscription?.status,
        userId: userId,
        hasPlan: !!plan,
        planIdFromPlan: plan?.id,
      });
    }
    
    // If no subscription found after retry, check if user is a household member
    // Household members should inherit the owner's subscription, so we need to be extra careful
    if (!subscription) {
      log.debug("No subscription found after retry, checking if user is household member");
      
      // Check if user is a household member who should inherit subscription
      try {
        const membersService = makeMembersService();
        const householdInfo = await membersService.getUserHouseholdInfo(userId);
        
        if (householdInfo?.isMember) {
          // User is a household member - they should inherit owner's subscription
          // Invalidate cache one more time and retry (in case cache was stale)
          log.debug("User is household member, invalidating cache and retrying subscription check", {
            userId,
            ownerId: householdInfo.ownerId,
          });
          
          subscriptionsService.invalidateSubscriptionCache(userId);
          const finalRetryData = await subscriptionsService.getCurrentUserSubscriptionData();
          subscription = finalRetryData.subscription;
          plan = finalRetryData.plan;
          
          log.debug("Subscription check result after household member retry:", {
            hasSubscription: !!subscription,
            subscriptionId: subscription?.id,
            planId: subscription?.planId,
            status: subscription?.status,
            userId: userId,
          });
          
          // If still no subscription found for household member, don't open pricing dialog
          // Let the onboarding dialog handle it (user needs to complete onboarding)
          if (!subscription) {
            log.debug("Household member has no subscription - onboarding will handle plan selection", {
              userId,
              ownerId: householdInfo.ownerId,
            });
            shouldOpenModal = false; // Don't open pricing dialog, let onboarding handle it
          } else {
            // Found subscription for household member - allow access
            shouldOpenModal = false;
          }
        } else {
          // User is not a household member and has no subscription
          // Don't open pricing dialog - let onboarding handle it (user needs to complete onboarding)
          log.debug("User is not a household member and has no subscription - onboarding will handle plan selection");
          shouldOpenModal = false; // Don't open pricing dialog, let onboarding handle it
        }
      } catch (householdCheckError) {
        // If error checking household membership, don't open pricing dialog
        // Let onboarding handle it
        log.error("Error checking household membership:", householdCheckError);
        shouldOpenModal = false; // Don't open pricing dialog, let onboarding handle it
      }
    } else {
      // Check if subscription status allows access
      const isActiveStatus = subscription.status === "active";
      const isTrialingStatus = subscription.status === "trialing";
      
      // If subscription exists and status is active or trialing, allow access
      if (isActiveStatus || isTrialingStatus) {
        shouldOpenModal = false;
      } else {
        // Open modal for "cancelled" status (user needs to reactivate)
        if (subscription.status === "cancelled") {
          log.debug("Subscription is cancelled, opening pricing dialog");
          shouldOpenModal = true;
          reason = "no_subscription"; // Use no_subscription reason to show dialog
        } else if (subscription.status === "past_due") {
          log.debug("Subscription is past_due, opening pricing dialog");
          shouldOpenModal = true;
          reason = "subscription_inactive";
        } else {
          // Allow access for other statuses (unpaid, etc.)
          log.debug("Subscription has other status, allowing access:", subscription.status);
          shouldOpenModal = false;
        }
      }
      
      log.debug("Subscription status check:", {
        status: subscription.status,
        isActive: isActiveStatus,
        isTrialing: isTrialingStatus,
        shouldOpenModal,
      });
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
  // Only show pricing dialog for cancelled subscriptions
  // For no subscription, let onboarding dialog handle it
  const subscriptionStatus = 
    subscription && subscription.status === "cancelled" 
      ? "cancelled" 
      : null;

  return (
    <SubscriptionProvider initialData={{ subscription, plan }}>
      {children}
      <SubscriptionGuard 
        shouldOpenModal={shouldOpenModal} 
        reason={reason}
        currentPlanId={currentPlanId}
        currentInterval={currentInterval}
        subscriptionStatus={subscriptionStatus}
      />
    </SubscriptionProvider>
  );
}

