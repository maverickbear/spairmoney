"use server";

import { createServerClient } from "@/lib/supabase-server";
import { checkPlanLimits } from "@/lib/api/plans";
import { PlanFeatures } from "@/lib/validations/plan";

export interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  message?: string;
}

export interface BillingLimitsResult {
  transactionLimit: LimitCheckResult;
  accountLimit: LimitCheckResult;
}

/**
 * Get billing limits (transaction and account limits)
 * This is a Server Action that replaces the /api/billing/limits route
 */
export async function getBillingLimitsAction(): Promise<BillingLimitsResult | null> {
  try {
    const supabase = await createServerClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Get plan limits once and reuse for both checks
    const { limits } = await checkPlanLimits(authUser.id);

    // Run both limit checks in parallel, but pass limits to avoid duplicate calls
    const [transactionLimit, accountLimit] = await Promise.all([
      checkTransactionLimitWithLimits(authUser.id, limits),
      checkAccountLimitWithLimits(authUser.id, limits),
    ]);

    return {
      transactionLimit,
      accountLimit,
    };
  } catch (error) {
    console.error("Error fetching limits:", error);
    return null;
  }
}

// Helper function to check transaction limit with pre-fetched limits
async function checkTransactionLimitWithLimits(userId: string, limits: PlanFeatures): Promise<LimitCheckResult> {
  try {
    // Unlimited plan
    if (limits.maxTransactions === -1) {
      return {
        allowed: true,
        limit: -1,
        current: 0,
      };
    }

    const supabase = await createServerClient();
    
    // Get start and end of month
    const month = new Date();
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    const { count, error } = await supabase
      .from("Transaction")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .gte("date", startOfMonth.toISOString())
      .lte("date", endOfMonth.toISOString());

    if (error) {
      console.error("Error checking transaction limit:", error);
      return {
        allowed: false,
        limit: limits.maxTransactions,
        current: 0,
        message: "Error checking limit",
      };
    }

    const current = count || 0;
    const allowed = current < limits.maxTransactions;

    return {
      allowed,
      limit: limits.maxTransactions,
      current,
      message: allowed ? undefined : `You've reached your monthly transaction limit (${limits.maxTransactions}). Upgrade to continue.`,
    };
  } catch (error) {
    console.error("Error in checkTransactionLimitWithLimits:", error);
    return {
      allowed: false,
      limit: 50,
      current: 0,
      message: "Error checking limit",
    };
  }
}

// Helper function to check account limit with pre-fetched limits
async function checkAccountLimitWithLimits(userId: string, limits: PlanFeatures): Promise<LimitCheckResult> {
  try {
    // Unlimited plan
    if (limits.maxAccounts === -1) {
      return {
        allowed: true,
        limit: -1,
        current: 0,
      };
    }

    const supabase = await createServerClient();
    
    const { count, error } = await supabase
      .from("Account")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    if (error) {
      console.error("Error checking account limit:", error);
      return {
        allowed: false,
        limit: limits.maxAccounts,
        current: 0,
        message: "Error checking limit",
      };
    }

    const current = count || 0;
    const allowed = current < limits.maxAccounts;

    return {
      allowed,
      limit: limits.maxAccounts,
      current,
      message: allowed ? undefined : `You've reached your account limit (${limits.maxAccounts}). Upgrade to continue.`,
    };
  } catch (error) {
    console.error("Error in checkAccountLimitWithLimits:", error);
    return {
      allowed: false,
      limit: 2,
      current: 0,
      message: "Error checking limit",
    };
  }
}

