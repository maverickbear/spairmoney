"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StripePricingTable } from "@/components/billing/stripe-pricing-table";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
  onSuccess?: () => void;
  preloadedPlans?: any[]; // Not used anymore, kept for backward compatibility
}

export function UpgradePlanModal({ 
  open, 
  onOpenChange, 
  currentPlanId,
  onSuccess,
  preloadedPlans = []
}: UpgradePlanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl sm:max-h-[90vh] flex flex-col !p-0 !gap-0">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-base">
            Select a plan to upgrade your subscription. You can change or cancel at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <StripePricingTable />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

