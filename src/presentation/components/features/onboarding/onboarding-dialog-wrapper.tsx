"use client";

import { useState, useEffect } from "react";
import { MultiStepOnboardingDialog } from "./multi-step-onboarding-dialog";

interface OnboardingDialogWrapperProps {
  initialStatus?: {
    hasPersonalData: boolean;
    hasExpectedIncome: boolean;
    hasPlan: boolean;
    completedCount: number;
    totalCount: number;
  };
}

export function OnboardingDialogWrapper({ initialStatus }: OnboardingDialogWrapperProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    // Check if onboarding was recently completed (within last 20 seconds)
    // This prevents reopening the dialog immediately after completing onboarding
    // Increased to 20 seconds to give subscription time to sync and database triggers to update User table
    const recentlyCompleted = sessionStorage.getItem("onboarding-recently-completed");
    if (recentlyCompleted) {
      const completedTime = parseInt(recentlyCompleted, 10);
      const now = Date.now();
      const timeSinceCompletion = now - completedTime;
      
      // If completed within last 20 seconds, don't open dialog
      if (timeSinceCompletion < 20000) {
        setOpen(false);
        // Clear the flag after checking
        sessionStorage.removeItem("onboarding-recently-completed");
        return;
      } else {
        // Clear old flag
        sessionStorage.removeItem("onboarding-recently-completed");
      }
    }

    // Check if onboarding is incomplete
    if (status) {
      // If status shows hasPlan is true, onboarding is complete - don't open
      if (status.hasPlan) {
        setOpen(false);
        return;
      }
      
      const isIncomplete = status.completedCount < status.totalCount;
      // Only open onboarding if incomplete AND user doesn't have cancelled subscription
      // (cancelled subscriptions should show pricing dialog, not onboarding)
      checkSubscriptionStatus(isIncomplete);
    } else {
      // If no status provided, check via API
      checkStatus();
    }
  }, [status]);

  async function checkSubscriptionStatus(shouldOpen: boolean) {
    if (!shouldOpen) {
      setOpen(false);
      return;
    }

    // Check if onboarding was recently completed before checking subscription
    const recentlyCompleted = sessionStorage.getItem("onboarding-recently-completed");
    if (recentlyCompleted) {
      const completedTime = parseInt(recentlyCompleted, 10);
      const now = Date.now();
      const timeSinceCompletion = now - completedTime;
      
      // If completed within last 20 seconds, don't open dialog
      // Increased to 20 seconds to give subscription time to sync and database triggers to update User table
      if (timeSinceCompletion < 20000) {
        setOpen(false);
        return;
      } else {
        // Clear old flag
        sessionStorage.removeItem("onboarding-recently-completed");
      }
    }

    // Check subscription status - if user has active/trialing subscription, don't open onboarding
    // (cancelled subscriptions should show pricing dialog, not onboarding)
    try {
      const response = await fetch("/api/v2/billing/subscription");
      if (response.ok) {
        const data = await response.json();
        // If subscription exists and is active or trialing, onboarding is complete
        if (data.subscription && 
            (data.subscription.status === "active" || data.subscription.status === "trialing")) {
          setOpen(false);
          return;
        }
        // If subscription exists and is cancelled, don't open onboarding
        // (pricing dialog will handle it)
        if (data.subscription && data.subscription.status === "cancelled") {
          setOpen(false);
          return;
        }
      }
      // If no subscription or not cancelled, open onboarding if incomplete
      setOpen(shouldOpen);
    } catch (error) {
      // On error, proceed with opening onboarding
      setOpen(shouldOpen);
    }
  }

  async function checkStatus() {
    // Check if onboarding was recently completed before making API call
    const recentlyCompleted = sessionStorage.getItem("onboarding-recently-completed");
    if (recentlyCompleted) {
      const completedTime = parseInt(recentlyCompleted, 10);
      const now = Date.now();
      const timeSinceCompletion = now - completedTime;
      
      // If completed within last 20 seconds, don't check status or open dialog
      // Increased to 20 seconds to give subscription time to sync and database triggers to update User table
      if (timeSinceCompletion < 20000) {
        setOpen(false);
        return;
      } else {
        // Clear old flag
        sessionStorage.removeItem("onboarding-recently-completed");
      }
    }

    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch("/api/v2/onboarding/status?_=" + Date.now());
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        const isIncomplete = data.completedCount < data.totalCount;
        setOpen(isIncomplete);
      } else if (response.status === 401) {
        // User not authenticated - silently ignore (expected on public pages)
        setOpen(false);
      }
    } catch (error) {
      // Silently ignore errors (network errors, etc.)
      // Only log unexpected errors
      if (error instanceof Error && !error.message.includes("401")) {
        console.error("Error checking onboarding status:", error);
      }
    }
  }

  function handleComplete() {
    setOpen(false);
    // Mark onboarding as recently completed to prevent reopening
    sessionStorage.setItem("onboarding-recently-completed", Date.now().toString());
    // Don't check status immediately - wait a bit for subscription to sync
    // The redirect will handle showing the dashboard
  }

  return (
    <MultiStepOnboardingDialog
      open={open}
      onOpenChange={setOpen}
      onComplete={handleComplete}
    />
  );
}

