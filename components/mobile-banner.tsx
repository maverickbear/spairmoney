"use client";

import { UpgradeBanner } from "@/components/common/upgrade-banner";

interface MobileBannerProps {
  hasSubscription?: boolean;
}

export function MobileBanner({ hasSubscription = true }: MobileBannerProps) {
  // Don't render MobileBanner if user doesn't have subscription
  if (!hasSubscription) {
    return null;
  }

  return (
    <div 
      className="sticky top-0 z-40 lg:hidden"
      id="mobile-banner"
    >
      <UpgradeBanner />
    </div>
  );
}

