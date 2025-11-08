"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { usePricingModal } from "@/contexts/pricing-modal-context";

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
  const { openModal } = usePricingModal();

  // Don't show upgrade card if user is already on premium plan
  if (currentPlan === "premium") {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-primary to-primary/90">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Upgrade Plan</h3>
              <p className="text-sm text-white/90">
                Unlock unlimited transactions, advanced analytics, priority support and 50% off
              </p>
            </div>
          </div>
          <Button
            onClick={openModal}
            variant="default"
            className="bg-white text-primary hover:bg-white/90"
          >
            Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

