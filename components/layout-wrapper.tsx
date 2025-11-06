"use client";

import { usePathname, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";
import { useEffect, useState } from "react";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const isAuthPage = pathname?.startsWith("/auth");
  const isAcceptPage = pathname?.startsWith("/members/accept");
  const isSelectPlanPage = pathname === "/select-plan";
  const isWelcomePage = pathname === "/welcome";

  useEffect(() => {
    // Check subscription for authenticated users
    if (!isAuthPage && !isAcceptPage && !isSelectPlanPage && !isWelcomePage) {
      checkSubscription();
    } else {
      // For select-plan and welcome pages, we still check subscription but don't block
      if (isSelectPlanPage || isWelcomePage) {
        checkSubscription();
      } else {
        setChecking(false);
      }
    }
  }, [pathname]);

  async function checkSubscription() {
    try {
      const response = await fetch("/api/billing/plans");
      if (response.ok) {
        const data = await response.json();
        // If user has no current plan, redirect to select-plan
        if (!data.currentPlanId) {
          if (!isSelectPlanPage && !isWelcomePage) {
            console.log("[LAYOUT] No subscription found, redirecting to /select-plan");
            router.push("/select-plan");
            return;
          }
          setHasSubscription(false);
        } else {
          setHasSubscription(true);
        }
      }
    } catch (error) {
      console.error("[LAYOUT] Error checking subscription:", error);
      if (!isSelectPlanPage && !isWelcomePage) {
        router.push("/select-plan");
        return;
      }
    } finally {
      setChecking(false);
    }
  }

  if (isAuthPage || isAcceptPage) {
    return <>{children}</>;
  }

  if (checking && !isSelectPlanPage && !isWelcomePage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If on select-plan or welcome page, show full screen without nav
  if (isSelectPlanPage || isWelcomePage) {
    return <>{children}</>;
  }

  // If no subscription, show full screen without nav (shouldn't reach here due to redirect)
  if (!hasSubscription) {
    return <>{children}</>;
  }

  // Normal layout with nav for users with subscription
  return (
    <>
      <div className="flex min-h-screen">
        <Nav hasSubscription={hasSubscription} />
        <main className="flex-1 md:ml-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-4 md:py-8">{children}</div>
        </main>
      </div>
      <BottomNav hasSubscription={hasSubscription} />
    </>
  );
}

