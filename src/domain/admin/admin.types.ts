/**
 * Domain types for admin functionality
 * Pure TypeScript types with no external dependencies
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  isBlocked?: boolean;
  /** When set, admin has overridden effective plan (app-only; display e.g. "Override: Pro"). */
  adminOverridePlanId?: string | null;
  /** Name of the override plan when adminOverridePlanId is set (for badge display). */
  adminOverridePlanName?: string | null;
  plan: {
    id: string;
    name: string;
  } | null;
  subscription: {
    id: string;
    status: string;
    planId: string;
    trialEndDate: string | null;
    trialStartDate: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
  household: {
    hasHousehold: boolean;
    isOwner: boolean;
    memberCount: number;
    householdId: string | null;
    ownerId: string | null;
  };
  pendingMembers?: Array<{
    email: string | null;
    name: string | null;
    status: string;
  }>;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  duration: "once" | "forever" | "repeating";
  durationInMonths: number | null;
  maxRedemptions: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  stripeCouponId: string | null;
  planIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// NOTE: SystemGroup has been completely removed - groups are no longer part of the system
// Categories now have a direct type property ("income" | "expense" | "transfer") instead of being grouped

export interface SystemCategory {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  createdAt: Date | string; // Allow string for serialization from server to client
  updatedAt: Date | string; // Allow string for serialization from server to client
  userId: null;
  isSystem: true;
  subcategories?: SystemSubcategory[];
}

export interface SystemSubcategory {
  id: string;
  name: string;
  categoryId: string;
  createdAt: Date | string; // Allow string for serialization from server to client
  updatedAt: Date | string; // Allow string for serialization from server to client
  userId: null;
  isSystem: true;
  logo: string | null;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  cancelledSubscriptions: number;
  totalMRR: number;
  totalARR: number;
  planDistribution: Array<{
    planId: string;
    planName: string;
    count: number;
  }>;
}

/**
 * Admin plan override: effective plan for feature access without changing Stripe/billing.
 * When set, the user gets this plan's limits; clearing (null) restores normal resolution.
 */
export interface PlanOverride {
  planId: string | null;
}

/** Admin invite for staff registration (creates super_admin users) */
export interface AdminInvitation {
  id: string;
  email: string;
  token: string;
  createdBy: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

