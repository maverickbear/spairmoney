"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-server";
import { formatDateStart, formatDateEnd } from "@/lib/utils/timestamp";

/**
 * FIXED VERSION: Get transactions without joins to avoid RLS issues
 * 
 * O problema: Quando fazemos select('*, account:Account(*)'), o Supabase aplica RLS em Account também
 * Se Account RLS bloquear, a transação não aparece mesmo que Transaction RLS permita
 * 
 * Solução: Buscar transações primeiro, depois buscar contas separadamente
 */
export async function getTransactionsInternalFixed(
  filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    accountId?: string;
    type?: string;
    search?: string;
    recurring?: boolean;
  },
  accessToken?: string,
  refreshToken?: string
) {
  const supabase = await createServerClient(accessToken, refreshToken);

  // Step 1: Buscar transações SEM joins (evita problemas de RLS com Account)
  let query = supabase
    .from("Transaction")
    .select("*")
    .order("date", { ascending: false });

  // Apply filters
  if (filters?.startDate) {
    query = query.gte("date", formatDateStart(filters.startDate));
  }

  if (filters?.endDate) {
    query = query.lte("date", formatDateEnd(filters.endDate));
  }

  if (filters?.categoryId) {
    query = query.eq("categoryId", filters.categoryId);
  }

  if (filters?.accountId) {
    query = query.eq("accountId", filters.accountId);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.search) {
    query = query.ilike("description", `%${filters.search}%`);
  }

  if (filters?.recurring !== undefined) {
    query = query.eq("recurring", filters.recurring);
  }

  const { data: transactions, error } = await query;

  if (error) {
    console.error("Supabase error fetching transactions:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to fetch transactions: ${error.message || JSON.stringify(error)}`);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Step 2: Buscar contas separadamente (apenas as que precisamos)
  const accountIds = [...new Set(transactions.map((t: any) => t.accountId).filter(Boolean))];
  const categoryIds = [...new Set(transactions.map((t: any) => t.categoryId).filter(Boolean))];
  const subcategoryIds = [...new Set(transactions.map((t: any) => t.subcategoryId).filter(Boolean))];

  // Fetch accounts
  const accountsMap = new Map();
  if (accountIds.length > 0) {
    const { data: accounts } = await supabase
      .from("Account")
      .select("*")
      .in("id", accountIds);
    
    if (accounts) {
      accounts.forEach((acc: any) => {
        accountsMap.set(acc.id, acc);
      });
    }
  }

  // Fetch categories
  const categoriesMap = new Map();
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("Category")
      .select("*")
      .in("id", categoryIds);
    
    if (categories) {
      categories.forEach((cat: any) => {
        categoriesMap.set(cat.id, cat);
      });
    }
  }

  // Fetch subcategories
  const subcategoriesMap = new Map();
  if (subcategoryIds.length > 0) {
    const { data: subcategories } = await supabase
      .from("Subcategory")
      .select("*")
      .in("id", subcategoryIds);
    
    if (subcategories) {
      subcategories.forEach((sub: any) => {
        subcategoriesMap.set(sub.id, sub);
      });
    }
  }

  // Step 3: Combinar transações com relacionamentos
  const transactionsWithRelations = transactions.map((tx: any) => ({
    ...tx,
    account: accountsMap.get(tx.accountId) || null,
    category: categoriesMap.get(tx.categoryId) || null,
    subcategory: subcategoriesMap.get(tx.subcategoryId) || null,
  }));

  return transactionsWithRelations;
}

