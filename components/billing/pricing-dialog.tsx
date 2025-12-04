"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DynamicPricingTable } from "@/components/billing/dynamic-pricing-table";
import { Plan } from "@/src/domain/subscriptions/subscriptions.validations";
import { useToast } from "@/components/toast-provider";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionStatus?: "no_subscription" | "cancelled" | null;
  currentPlanId?: string;
  currentInterval?: "month" | "year" | null;
  onTrialStarted?: () => void;
}

export function PricingDialog({
  open,
  onOpenChange,
  subscriptionStatus,
  currentPlanId,
  currentInterval,
  onTrialStarted,
}: PricingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [trialStarted, setTrialStarted] = useState(false);
  const [canClose, setCanClose] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTrialStarted(false);
      setCanClose(false);
    } else {
      // If user already has subscription (status is cancelled but they can close), allow closing
      // Otherwise, subscription is required
      setCanClose(subscriptionStatus === "cancelled");
    }
  }, [open, subscriptionStatus]);

  async function handleSelectPlan(planId: string, interval: "month" | "year") {
    setLoading(true);
    try {
      // Start trial without checkout
      const response = await fetch("/api/billing/start-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTrialStarted(true);
        setCanClose(true); // Allow closing after trial is started
        
        toast({
          title: "Success",
          description: "Your 30-day free trial has started!",
          variant: "success",
        });

        // Invalidate caches
        try {
        } catch (error) {
          console.warn("Error invalidating billing cache:", error);
        }

        // Call success callback
        onTrialStarted?.();

        // Refresh page after a short delay to ensure subscription is loaded
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to start trial",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting trial:", error);
      toast({
        title: "Error",
        description: "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose(open: boolean) {
    // Only allow closing if canClose is true
    if (canClose || !open) {
      onOpenChange(open);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {trialStarted ? "Trial Active!" : "Choose Your Plan"}
          </DialogTitle>
          <DialogDescription>
            {trialStarted
              ? "Your 30-day free trial has been activated. Enjoy full access to all features!"
              : subscriptionStatus === "cancelled"
              ? "Your subscription has been cancelled. Select a plan to reactivate."
              : "Select a plan to get started. No credit card required for the 30-day free trial."}
          </DialogDescription>
        </DialogHeader>

        {trialStarted ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Trial Active!</h3>
            <p className="text-muted-foreground text-center mb-6">
              Your 30-day free trial has started. You now have full access to all features.
            </p>
            <Button onClick={() => handleClose(false)}>
              Get Started
            </Button>
          </div>
        ) : (
          <DynamicPricingTable
            currentPlanId={currentPlanId}
            currentInterval={currentInterval}
            onSelectPlan={handleSelectPlan}
            showTrial={true}
            className=""
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Starting your trial...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

