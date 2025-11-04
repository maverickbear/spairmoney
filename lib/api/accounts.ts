"use server";

import { createServerClient } from "@/lib/supabase-server";
import { AccountFormData } from "@/lib/validations/account";
import { getCurrentTimestamp, formatTimestamp } from "@/lib/utils/timestamp";
import { getAccountBalance } from "./transactions";

export async function getAccounts() {
  const supabase = createServerClient();

  const { data: accounts, error } = await supabase
    .from("Account")
    .select("*")
    .order("name", { ascending: true });

  if (error || !accounts) {
    return [];
  }

  // Fetch all transactions in one query to avoid N+1 queries
  const { data: transactions } = await supabase
    .from("Transaction")
    .select("accountId, type, amount, transferToId, transferFromId");

  // Calculate balances in memory
  const balances = new Map<string, number>();
  
  // Initialize all accounts to 0
  accounts.forEach((account) => {
    balances.set(account.id, 0);
  });

  // Calculate balances from transactions
  for (const tx of transactions || []) {
    const currentBalance = balances.get(tx.accountId) || 0;
    
    if (tx.type === "income") {
      balances.set(tx.accountId, currentBalance + tx.amount);
    } else if (tx.type === "expense") {
      balances.set(tx.accountId, currentBalance - tx.amount);
    } else if (tx.type === "transfer") {
      if (tx.transferToId) {
        // Outgoing transfer - reduce balance
        balances.set(tx.accountId, currentBalance - tx.amount);
      } else {
        // Incoming transfer - increase balance
        balances.set(tx.accountId, currentBalance + tx.amount);
      }
    }
  }

  // Combine accounts with their balances
  const accountsWithBalances = accounts.map((account) => ({
    ...account,
    balance: balances.get(account.id) || 0,
  }));

  return accountsWithBalances;
}

export async function createAccount(data: AccountFormData) {
  const supabase = createServerClient();

  // Generate UUID for the account
  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: account, error } = await supabase
    .from("Account")
    .insert({
      id,
      name: data.name,
      type: data.type,
      creditLimit: data.type === "credit" ? data.creditLimit : null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating account:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to create account: ${error.message || JSON.stringify(error)}`);
  }

  return account;
}

export async function updateAccount(id: string, data: Partial<AccountFormData>) {
  const supabase = createServerClient();

  const updateData: Record<string, unknown> = { ...data };
  
  // Handle creditLimit: set to null if not credit type, otherwise use provided value
  if (data.type !== undefined) {
    if (data.type === "credit") {
      updateData.creditLimit = data.creditLimit ?? null;
    } else {
      updateData.creditLimit = null;
    }
  } else if (data.creditLimit !== undefined) {
    // If only creditLimit is being updated, keep it as is
    updateData.creditLimit = data.creditLimit;
  }
  
  updateData.updatedAt = formatTimestamp(new Date());

  const { data: account, error } = await supabase
    .from("Account")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase error updating account:", error);
    throw new Error(`Failed to update account: ${error.message || JSON.stringify(error)}`);
  }

  return account;
}

export async function deleteAccount(id: string) {
  const supabase = createServerClient();

  const { error } = await supabase.from("Account").delete().eq("id", id);

  if (error) {
    console.error("Supabase error deleting account:", error);
    throw new Error(`Failed to delete account: ${error.message || JSON.stringify(error)}`);
  }
}
