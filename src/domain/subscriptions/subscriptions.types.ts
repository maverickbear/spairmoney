/**
 * Domain types for subscriptions
 * Pure TypeScript types with no external dependencies
 */

export interface BaseSubscription {
  id: string;
  userId: string | null;
  householdId: string | null;
  planId: string;
  status: "active" | "trialing" | "cancelled" | "past_due" | "unpaid";
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodStart: Date | string | null;
  currentPeriodEnd: Date | string | null;
  trialEndDate: Date | string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BasePlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: BasePlanFeatures;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  stripeProductId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Public plan type - excludes sensitive Stripe IDs
 * Used for public endpoints (landing page, pricing sections)
 */
export interface PublicPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: BasePlanFeatures;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BasePlanFeatures {
  maxTransactions: number;
  maxAccounts: number;
  hasInvestments: boolean;
  hasAdvancedReports: boolean;
  hasCsvExport: boolean;
  hasCsvImport: boolean;
  hasDebts: boolean;
  hasGoals: boolean;
  hasBankIntegration: boolean;
  hasHousehold: boolean;
  hasBudgets: boolean;
  hasReceiptScanner: boolean;
}

export interface BaseSubscriptionData {
  subscription: BaseSubscription | null;
  plan: BasePlan | null;
  limits: BasePlanFeatures;
  /** End of local trial (users.trial_ends_at). Used when no Stripe subscription yet. */
  trialEndsAt?: string | null;
}

export interface BaseLimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  message?: string;
}

/**
 * User Service Subscription types
 * 
 * ⚠️ IMPORTANT: These are for EXTERNAL service subscriptions (Netflix, Spotify, ChatGPT, etc.)
 * NOT for Spair Money app subscriptions. For app subscriptions, see AppSubscription type.
 * 
 * This tracks user's personal expenses for external services they subscribe to.
 */
export interface UserServiceSubscription {
  id: string;
  userId: string;
  serviceName: string;
  /** Links to subcategories table (expense categorization). Used for reports, budgets, and planned payments so this subscription is categorized under the correct expense category. */
  subcategoryId?: string | null;
  planId?: string | null;
  amount: number;
  description?: string | null;
  billingFrequency: "monthly" | "yearly" | "weekly" | "biweekly" | "semimonthly" | "daily";
  billingDay?: number | null;
  accountId: string;
  isActive: boolean;
  firstBillingDate: string;
  createdAt: string;
  updatedAt: string;
  /** Display name of the subscription service category the user chose (e.g. Music Streaming, Streaming Video). Shown in the list. */
  subscriptionCategoryName?: string | null;
  // Relations
  subcategory?: { id: string; name: string; logo?: string | null } | null;
  /** Parent transaction category (from categories table; often "Subscription"). Used for expense categorization. */
  category?: { id: string; name: string } | null;
  account?: { id: string; name: string } | null;
  serviceLogo?: string | null; // Logo from SubscriptionService table
  plan?: { id: string; planName: string } | null; // Plan from SubscriptionServicePlan
}

export interface UserServiceSubscriptionFormData {
  serviceName: string;
  subcategoryId?: string | null;
  amount: number;
  description?: string | null;
  billingFrequency: "monthly" | "yearly" | "weekly" | "biweekly" | "semimonthly" | "daily";
  billingDay?: number | null;
  accountId: string;
  firstBillingDate: Date | string;
  categoryId?: string | null;
  /** Display name of the subscription service category (e.g. Music Streaming). Sent by client so the list shows the category the user chose. */
  subscriptionCategoryName?: string | null;
  newSubcategoryName?: string | null;
  planId?: string | null; // ID of the selected SubscriptionServicePlan
  isActive?: boolean;
}

// Detected Subscription types (for subscription detection from transactions)
export interface DetectedSubscription {
  merchantName: string;
  merchantEntityId?: string | null;
  logoUrl?: string | null;
  amount: number;
  frequency: "monthly" | "weekly" | "biweekly" | "semimonthly" | "daily";
  billingDay?: number;
  firstBillingDate: string;
  accountId: string;
  accountName: string;
  transactionCount: number;
  lastTransactionDate: string;
  confidence: "high" | "medium" | "low";
  description?: string | null;
  transactionIds: string[]; // IDs of transactions used for detection
}

