/**
 * Accounts Repository
 * Data access layer for accounts - only handles database operations
 * No business logic here
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/lib/utils/logger";
import { IAccountsRepository } from "./interfaces/accounts.repository.interface";

export interface AccountRow {
  id: string;
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  user_id: string | null;
  credit_limit: number | null;
  initial_balance: number | null;
  currency_code: string | null;
  created_at: string;
  updated_at: string;
  due_day_of_month: number | null;
  extra_credit: number;
  household_id: string | null;
  deleted_at: string | null;
  is_default: boolean;
}

export interface AccountOwnerRow {
  account_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}



export class AccountsRepository implements IAccountsRepository {
  /**
   * Find all accounts for a user
   */
  async findAll(
    accessToken?: string,
    refreshToken?: string,
    options?: { selectFields?: string[] }
  ): Promise<AccountRow[]> {
    const supabase = await createServerClient(accessToken, refreshToken);
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // Log as debug in development, but don't treat as error
      // This can happen in cached functions when tokens aren't available
      const errorMessage = authError?.message || "Auth session missing!";
      if (process.env.NODE_ENV === 'development') {
        logger.debug("[AccountsRepository] User not authenticated:", errorMessage);
      }
      return [];
    }
    
    const selectFields = options?.selectFields || [
      "id", "name", "type", "initial_balance", "credit_limit", "due_day_of_month",
      "created_at", "updated_at", "user_id", "household_id", "is_default"
    ];

    const { data: accounts, error } = await supabase
      .from("accounts")
      .select(selectFields.join(", ") + ", deleted_at")
      .is("deleted_at", null) // Exclude soft-deleted records
      .order("name", { ascending: true });

    if (error) {
      logger.error("[AccountsRepository] Error fetching accounts:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId: user.id,
      });
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return (accounts || []) as unknown as AccountRow[];
  }

  /**
   * Map raw Supabase row to AccountRow.
   * Supabase may return snake_case keys; we normalize so type and other fields are always present.
   */
  private static toAccountRow(raw: Record<string, unknown>): AccountRow {
    const typeVal = raw.type ?? raw.account_type;
    const typeStr = typeof typeVal === "string" ? typeVal.trim().toLowerCase() : "";
    const validTypes: AccountRow["type"][] = ["cash", "checking", "savings", "credit", "investment", "other"];
    const type = validTypes.includes(typeStr as AccountRow["type"]) ? (typeStr as AccountRow["type"]) : "other";

    const toNum = (v: unknown): number | null => {
      if (v == null) return null;
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string") { const n = Number(v); return Number.isNaN(n) ? null : n; }
      return null;
    };

    return {
      id: String(raw.id ?? ""),
      name: String(raw.name ?? ""),
      type,
      user_id: raw.user_id != null ? String(raw.user_id) : null,
      credit_limit: toNum(raw.credit_limit),
      initial_balance: toNum(raw.initial_balance),
      currency_code: raw.currency_code != null ? String(raw.currency_code) : null,
      created_at: String(raw.created_at ?? ""),
      updated_at: String(raw.updated_at ?? ""),
      due_day_of_month: toNum(raw.due_day_of_month) != null && Number.isInteger(Number(raw.due_day_of_month)) ? Number(raw.due_day_of_month) : null,
      extra_credit: Number(raw.extra_credit) || 0,
      household_id: raw.household_id != null ? String(raw.household_id) : null,
      deleted_at: raw.deleted_at != null ? String(raw.deleted_at) : null,
      is_default: Boolean(raw.is_default),
    };
  }

  /**
   * Find account by ID
   */
  async findById(id: string, accessToken?: string, refreshToken?: string): Promise<AccountRow | null> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: account, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null) // Exclude soft-deleted records
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error("[AccountsRepository] Error fetching account:", error);
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    if (!account || typeof account !== "object") return null;
    return AccountsRepository.toAccountRow(account as Record<string, unknown>);
  }

  /**
   * Find multiple accounts by IDs
   */
  async findByIds(ids: string[], accessToken?: string, refreshToken?: string): Promise<AccountRow[]> {
    if (ids.length === 0) {
      return [];
    }

    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("id, name, type")
      .in("id", ids)
      .is("deleted_at", null); // Exclude soft-deleted records

    if (error) {
      logger.error("[AccountsRepository] Error fetching accounts by IDs:", error);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return (accounts || []) as AccountRow[];
  }


  /**
   * Create a new account
   * Receives camelCase parameters and maps to snake_case for database
   */
  async create(data: {
    id: string;
    name: string;
    type: AccountRow['type'];
    userId: string;
    creditLimit?: number | null;
    initialBalance?: number | null;
    dueDayOfMonth?: number | null;
    currencyCode?: string | null;
    householdId?: string | null;
    createdAt: string;
    updatedAt: string;
  }): Promise<AccountRow> {
    const supabase = await createServerClient();

    // Map camelCase to snake_case for database; coerce numerics (Supabase expects number or null)
    const creditLimit = data.creditLimit != null ? Number(data.creditLimit) : null;
    const initialBalance = data.initialBalance != null ? Number(data.initialBalance) : null;
    const dueDay = data.dueDayOfMonth != null ? Number(data.dueDayOfMonth) : null;
    const typeStr = typeof data.type === "string" ? data.type.trim().toLowerCase() : data.type;

    const { data: account, error } = await supabase
      .from("accounts")
      .insert({
        id: data.id,
        name: data.name,
        type: typeStr,
        credit_limit: creditLimit,
        initial_balance: initialBalance,
        due_day_of_month: dueDay != null && Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31 ? dueDay : null,
        currency_code: data.currencyCode || 'USD',
        user_id: data.userId,
        household_id: data.householdId ?? null,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
      .select()
      .single();

    if (error) {
      logger.error("[AccountsRepository] Error creating account:", error);
      throw new Error(`Failed to create account: ${error.message}`);
    }

    return AccountsRepository.toAccountRow((account ?? {}) as Record<string, unknown>);
  }

  /**
   * Update an account
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'other';
      creditLimit: number | null;
      initialBalance: number | null;
      dueDayOfMonth: number | null;
      currencyCode: string | null;
      updatedAt: string;
    }>
  ): Promise<AccountRow> {
    const supabase = await createServerClient();

    // Map camelCase to snake_case for database; coerce type and numerics so Supabase gets correct types
    const updateData: Partial<{
      name: string;
      type: string;
      credit_limit: number | null;
      initial_balance: number | null;
      due_day_of_month: number | null;
      currency_code: string | null;
      updated_at: string;
    }> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = typeof data.type === "string" ? data.type.trim().toLowerCase() : data.type;
    if (data.creditLimit !== undefined) updateData.credit_limit = data.creditLimit != null ? Number(data.creditLimit) : null;
    if (data.initialBalance !== undefined) updateData.initial_balance = data.initialBalance != null ? Number(data.initialBalance) : null;
    if (data.dueDayOfMonth !== undefined) {
      const d = data.dueDayOfMonth != null ? Number(data.dueDayOfMonth) : null;
      updateData.due_day_of_month = d != null && Number.isInteger(d) && d >= 1 && d <= 31 ? d : null;
    }
    if (data.currencyCode !== undefined) updateData.currency_code = data.currencyCode;
    if (data.updatedAt !== undefined) updateData.updated_at = data.updatedAt;

    const { data: account, error } = await supabase
      .from("accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[AccountsRepository] Error updating account:", error);
      throw new Error(`Failed to update account: ${error.message}`);
    }

    return account as AccountRow;
  }

  /**
   * Permanently delete an account from Supabase.
   * Removes account_owners rows first to avoid FK violations, then deletes the account row.
   * Uses RPC so account_id is passed as uuid (avoids Postgres "text = uuid" operator error).
   */
  async delete(id: string): Promise<void> {
    const supabase = await createServerClient();

    // Delete account_owners via RPC so the parameter is cast to uuid (PostgREST sends filter values as text)
    const { error: ownersError } = await supabase.rpc("delete_account_owners_by_account_id", {
      p_account_id: id,
    });

    if (ownersError) {
      logger.error("[AccountsRepository] Error deleting account owners:", ownersError);
      throw new Error(`Failed to delete account owners: ${ownersError.message}`);
    }

    // Hard delete the account row from Supabase
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("[AccountsRepository] Error deleting account:", error);
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get account owners
   */
  async getAccountOwners(
    accountId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<AccountOwnerRow[]> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: owners, error } = await supabase
      .from("account_owners")
      .select("account_id, owner_id, created_at, updated_at")
      .eq("account_id", accountId)
      .is("deleted_at", null); // Exclude soft-deleted records

    if (error) {
      logger.error("[AccountsRepository] Error fetching account owners:", error);
      throw new Error(`Failed to fetch account owners: ${error.message}`);
    }

    return (owners || []) as AccountOwnerRow[];
  }

  /**
   * Set account owners (replaces existing).
   * Insert or re-activate; on duplicate key (e.g. soft-deleted row not visible to fetch),
   * re-activate by updating deleted_at. Deduplicates ownerIds to avoid duplicate inserts.
   */
  async setAccountOwners(accountId: string, ownerIds: string[], now: string): Promise<void> {
    const supabase = await createServerClient();
    const uniqueOwnerIds = [...new Set(ownerIds)];

    // 1. Fetch existing rows for this account (including soft-deleted) for deactivate step
    const { data: existing, error: fetchError } = await supabase
      .from("account_owners")
      .select("id, owner_id, deleted_at")
      .eq("account_id", accountId);

    if (fetchError) {
      logger.error("[AccountsRepository] Error fetching account owners:", fetchError);
      throw new Error(`Failed to fetch account owners: ${fetchError.message}`);
    }

    const existingByOwner = new Map((existing || []).map((r) => [r.owner_id, r]));

    // 2. For each desired owner: insert if missing, or re-activate if soft-deleted (or on duplicate key)
    for (const ownerId of uniqueOwnerIds) {
      const row = existingByOwner.get(ownerId);
      if (row) {
        if (row.deleted_at != null) {
          const { error: updateError } = await supabase
            .from("account_owners")
            .update({ deleted_at: null, updated_at: now })
            .eq("id", row.id);
          if (updateError) {
            logger.error("[AccountsRepository] Error re-activating account owner:", updateError);
            throw new Error(`Failed to update account owners: ${updateError.message}`);
          }
        }
      } else {
        const { error: insertError } = await supabase.from("account_owners").insert({
          account_id: accountId,
          owner_id: ownerId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });
        if (insertError) {
          // Duplicate key: row exists (e.g. soft-deleted and not in fetch). Re-activate by (account_id, owner_id).
          const isDuplicate = insertError.code === "23505" || insertError.message?.includes("duplicate key");
          if (isDuplicate) {
            const { error: updateError } = await supabase
              .from("account_owners")
              .update({ deleted_at: null, updated_at: now })
              .eq("account_id", accountId)
              .eq("owner_id", ownerId);
            if (updateError) {
              logger.error("[AccountsRepository] Error re-activating account owner after duplicate:", updateError);
              throw new Error(`Failed to update account owners: ${updateError.message}`);
            }
          } else {
            logger.error("[AccountsRepository] Error inserting account owner:", insertError);
            throw new Error(`Failed to update account owners: ${insertError.message}`);
          }
        }
      }
    }

    // 3. Soft-delete owners that are NOT in the new list
    const toDeactivate = (existing || []).filter(
      (r) => r.deleted_at == null && !ownerIds.includes(r.owner_id)
    );
    for (const row of toDeactivate) {
      const { error: updateError } = await supabase
        .from("account_owners")
        .update({ deleted_at: now, updated_at: now })
        .eq("id", row.id);
      if (updateError) {
        logger.error("[AccountsRepository] Error soft-deleting account owner:", updateError);
        throw new Error(`Failed to remove old account owners: ${updateError.message}`);
      }
    }
  }

  /**
   * Get transactions for account balance calculation
   */
  async getTransactionsForBalance(
    accountIds: string[],
    endDate: Date,
    accessToken?: string,
    refreshToken?: string
  ): Promise<Array<{
    accountId: string;
    type: string;
    amount: unknown;
    date: string;
  }>> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("account_id, type, amount, date, transfer_from_id, transfer_to_id")
      .in("account_id", accountIds)
      .lte("date", endDate.toISOString())
      .is("deleted_at", null); // Exclude soft-deleted records

    if (error) {
      logger.error("[AccountsRepository] Error fetching transactions:", error);
      return [];
    }

    return (transactions || []).map(tx => ({
      accountId: tx.account_id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      transferFromId: tx.transfer_from_id ?? null,
      transferToId: tx.transfer_to_id ?? null,
    }));
  }

  /**
   * Check if account has transactions
   */
  async hasTransactions(accountId: string): Promise<boolean> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("id")
      .eq("account_id", accountId)
      .is("deleted_at", null) // Exclude soft-deleted records
      .limit(1);

    if (error) {
      logger.error("[AccountsRepository] Error checking transactions:", error);
      return true; // Assume has transactions to be safe
    }

    return (data?.length ?? 0) > 0;
  }

  /**
   * Transfer transactions from one account to another
   */
  async transferTransactions(fromAccountId: string, toAccountId: string): Promise<number> {
    const supabase = await createServerClient();

    // Get count before transfer
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id")
      .eq("account_id", fromAccountId)
      .is("deleted_at", null); // Exclude soft-deleted records

    const count = transactions?.length || 0;

    if (count === 0) {
      return 0;
    }

    // Update transactions
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ account_id: toAccountId })
      .eq("account_id", fromAccountId)
      .is("deleted_at", null); // Only update non-deleted transactions

    if (updateError) {
      logger.error("[AccountsRepository] Error transferring transactions:", updateError);
      throw new Error(`Failed to transfer transactions: ${updateError.message}`);
    }

    // Update transfer references
    await supabase
      .from("transactions")
      .update({ transfer_to_id: toAccountId })
      .eq("transfer_to_id", fromAccountId)
      .is("deleted_at", null); // Only update non-deleted transactions

    return count;
  }

  /**
   * Get user names and avatar URLs by IDs
   */
  async getUserNamesByIds(
    userIds: string[],
    accessToken?: string,
    refreshToken?: string
  ): Promise<Array<{ id: string; name: string | null; avatarUrl: string | null }>> {
    if (userIds.length === 0) {
      return [];
    }

    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .in("id", userIds);

    if (error) {
      logger.error("[AccountsRepository] Error fetching user names:", error);
      return [];
    }

    return (users || []).map((u: { id: string; name: string | null; avatar_url: string | null }) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatar_url ?? null,
    }));
  }
  /**
   * Set default account for a user
   * This unsets the default flag for all other accounts associated with the user/household context
   * and sets it to true for the specified account.
   */
  async setDefaultAccount(accountId: string, userId: string): Promise<void> {
    const supabase = await createServerClient();
    void userId; // Passed for API consistency; RLS scopes which rows can be updated.

    // First, verify the account belongs to the user or their household (implicitly checked by verifying ownership in service)
    // We'll perform this update in two steps or a transaction if possible.
    // Since we don't have explicit transaction support here in the client easily exposed,
    // we'll unset all first then set the one.

    // 1. Unset is_default for all accounts owned by this user
    // Ideally this should be scoped to household if accounts are shared, but for now user_id seems to be the owner
    // Let's look at how accounts are queried. 
    // Accounts have user_id and ownerIds (via account_owners).
    // If we want a "User's default account", it should be relative to the user.
    // However, the column is on the `accounts` table. This implies an account is globally default?
    // Or default for the `user_id` on the account?
    // If multiple people own the account, can it be default for one but not another?
    // The current schema adds `is_default` to `accounts`, so it's a property of the account itself.
    // This means if I share an account, and I mark it default, it is default for everyone.
    // This is acceptable for a "Household Finance" app where accounts are shared.

    // Unset all is_default for this user's accounts (or all accounts this user has access to?)
    // To be safe and simple: Unset for all accounts where this user is an owner.
    
    // Get all accounts this user owns
    // Actually, simpler: Update all accounts where user_id = userId OR where id IN (select account_id from account_owners where owner_id = userId)
    // But that's a complex query for Supabase client.
    
    // Let's assume the service handles the "scope" logic or we just unset for all account IDs that the service passes?
    // No, repository should handle data.
    
    // Let's try: Update accounts set is_default = false where is_default = true (filtered by RLS?)
    // If RLS is set up correctly, `supabase.from('accounts').update...` will only affect rows the user can seeing/updating.
    
    const { error: unsetError } = await supabase
      .from("accounts")
      .update({ is_default: false })
      .eq("is_default", true); // Optimize: only update those that are true
      
    if (unsetError) {
      logger.error("[AccountsRepository] Error unsetting default account:", unsetError);
      throw new Error(`Failed to unset default accounts: ${unsetError.message}`);
    }

    // 2. Set is_default = true for the target account
    const { error: setError } = await supabase
      .from("accounts")
      .update({ is_default: true })
      .eq("id", accountId);

    if (setError) {
      logger.error("[AccountsRepository] Error setting default account:", setError);
      throw new Error(`Failed to set default account: ${setError.message}`);
    }
  }
}

