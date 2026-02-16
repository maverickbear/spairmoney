/**
 * Domain types for accounts
 * Pure TypeScript types with no external dependencies
 */

export interface BaseAccount {
  id: string;
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  userId?: string | null;
  creditLimit?: number | null;
  initialBalance?: number | null;
  createdAt?: string;
  updatedAt?: string;
  dueDayOfMonth?: number | null;
  extraCredit?: number;
  isDefault?: boolean;
}

/** Per-owner info for display (avatar, name) */
export interface AccountOwnerInfo {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AccountWithBalance extends BaseAccount {
  balance: number;
  householdName?: string | null;
  ownerIds?: string[];
  /** Per-owner details for UI (avatar, name); when present, use for multiple avatars side-by-side */
  owners?: AccountOwnerInfo[];
}

export interface AccountBalance {
  accountId: string;
  balance: number;
  lastCalculatedAt: Date;
}

export interface AccountSummary {
  totalBalance: number;
  byType: Record<string, number>;
  byOwner: Record<string, number>;
  accounts: AccountWithBalance[];
}

// Alias for backward compatibility (matches client-side Account interface)
export interface Account extends BaseAccount {
  balance: number;
  householdName?: string | null;
  ownerIds?: string[];
}

