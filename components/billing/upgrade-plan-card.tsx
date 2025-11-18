"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradePlanCardProps {
  currentPlan?: string;
  currentPlanId?: string;
  onUpgradeSuccess?: () => void;
}

export function UpgradePlanCard({ 
  currentPlan, 
  currentPlanId,
  onUpgradeSuccess 
}: UpgradePlanCardProps) {
  const router = useRouter();

  // Only show upgrade card if user has an essential plan (can upgrade to pro)
  // Don't show if:
  // - No plan exists (user needs to select a plan first)
  // - Already on pro plan (highest plan)
  if (!currentPlan || currentPlan === "pro") {
    return null;
  }

  // Only show for essential plan
  if (currentPlan !== "essential") {
    return null;
  }

  return (
    <Card 
      className="bg-gradient-to-r from-primary to-primary/90 cursor-pointer hover:from-primary/90 hover:to-primary/80 transition-all"
      onClick={() => router.push("/pricing")}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white">Upgrade Plan</h3>
            <p className="text-xs sm:text-sm text-white/90">
              Unlock unlimited transactions, advanced analytics, priority support and 50% off
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

