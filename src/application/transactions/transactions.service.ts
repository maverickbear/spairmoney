/**
 * Transactions Service
 * Business logic for transaction management
 */

import { TransactionsRepository } from "@/src/infrastructure/database/repositories/transactions.repository";
import { AccountsRepository } from "@/src/infrastructure/database/repositories/accounts.repository";
import { CategoriesRepository } from "@/src/infrastructure/database/repositories/categories.repository";
import { TransactionsMapper } from "./transactions.mapper";
import { TransactionFormData, TransactionUpdateData } from "../../domain/transactions/transactions.validations";
import { BaseTransaction, TransactionWithRelations, TransactionFilters, TransactionQueryResult } from "../../domain/transactions/transactions.types";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { formatTimestamp, formatDateOnly } from "@/src/infrastructure/utils/timestamp";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { guardTransactionLimit, throwIfNotAllowed, getCurrentUserId } from "@/src/application/shared/feature-guard";
import { requireTransactionOwnership } from "@/src/infrastructure/utils/security";
import { logger } from "@/src/infrastructure/utils/logger";
import { invalidateTransactionCaches } from "@/src/infrastructure/cache/cache.manager";
import { encryptDescription, decryptDescription, normalizeDescription } from "@/src/infrastructure/utils/transaction-encryption";
import { makeSubscriptionsService } from "@/src/application/subscriptions/subscriptions.factory";
import { AppError } from "../shared/app-error";

// Helper function to get user subscription data
async function getUserSubscriptionData(userId: string) {
  const service = makeSubscriptionsService();
  return service.getUserSubscriptionData(userId);
}
import { suggestCategory } from "@/src/application/shared/category-learning";
import { TransactionRow } from "@/src/infrastructure/database/repositories/transactions.repository";

export class TransactionsService {
  constructor(private repository: TransactionsRepository) {}

  /**
   * Get transactions with filters
   */
  async getTransactions(
    filters?: TransactionFilters,
    accessToken?: string,
    refreshToken?: string
  ): Promise<TransactionQueryResult> {
    const supabase = await createServerClient(accessToken, refreshToken);

    // Get total count
    const total = await this.repository.count(filters, accessToken, refreshToken);

    // Get transactions
    const rows = await this.repository.findAll(filters, accessToken, refreshToken);

    // Decrypt descriptions
    const decryptedRows = rows.map(row => ({
      ...row,
      description: row.description ? decryptDescription(row.description) : null,
    }));

    // Fetch related data separately to avoid RLS issues
    const accountIds = [...new Set(decryptedRows.map(t => t.accountId))];
    const categoryIds = [...new Set(decryptedRows.map(t => t.categoryId).filter(Boolean) as string[])];
    const subcategoryIds = [...new Set(decryptedRows.map(t => t.subcategoryId).filter(Boolean) as string[])];

    // Fetch accounts using repository
    const accountsMap = new Map<string, { id: string; name: string; type: string }>();
    if (accountIds.length > 0) {
      const accountsRepository = new AccountsRepository();
      const accounts = await accountsRepository.findByIds(accountIds, accessToken, refreshToken);

      accounts.forEach(account => {
        accountsMap.set(account.id, { id: account.id, name: account.name, type: account.type });
      });
    }

    // Fetch categories using repository
    const categoriesMap = new Map<string, { id: string; name: string; macroId?: string }>();
    if (categoryIds.length > 0) {
      const categoriesRepository = new CategoriesRepository();
      const categories = await categoriesRepository.findCategoriesByIds(categoryIds, accessToken, refreshToken);

      categories.forEach(category => {
        categoriesMap.set(category.id, { id: category.id, name: category.name, macroId: category.groupId });
      });
    }

    // Fetch subcategories using repository
    const subcategoriesMap = new Map<string, { id: string; name: string; logo?: string | null }>();
    if (subcategoryIds.length > 0) {
      const categoriesRepository = new CategoriesRepository();
      const subcategories = await categoriesRepository.findSubcategoriesByIds(subcategoryIds, accessToken, refreshToken);

      subcategories.forEach(subcategory => {
        subcategoriesMap.set(subcategory.id, { id: subcategory.id, name: subcategory.name, logo: subcategory.logo });
      });
    }

    // Map to domain entities with relations
    const transactions: TransactionWithRelations[] = decryptedRows.map(row => {
      const account = accountsMap.get(row.accountId);
      const category = row.categoryId ? categoriesMap.get(row.categoryId) : null;
      const subcategory = row.subcategoryId ? subcategoriesMap.get(row.subcategoryId) : null;

      return TransactionsMapper.toDomainWithRelations(row, {
        account: account ? { ...account, balance: undefined } : null,
        category: category ? { ...category, macro: undefined } : null,
        subcategory: subcategory || null,
      });
    });

    // Apply search filter in memory if provided
    let filteredTransactions = transactions;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTransactions = transactions.filter(tx => {
        const description = tx.description?.toLowerCase() || '';
        const accountName = tx.account?.name.toLowerCase() || '';
        const categoryName = tx.category?.name.toLowerCase() || '';
        return description.includes(searchLower) || 
               accountName.includes(searchLower) || 
               categoryName.includes(searchLower);
      });
    }

    return {
      transactions: filteredTransactions,
      total: filters?.search ? filteredTransactions.length : total,
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    id: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<TransactionWithRelations | null> {
    const row = await this.repository.findById(id, accessToken, refreshToken);
    
    if (!row) {
      return null;
    }

    // Decrypt description
    const decryptedRow = {
      ...row,
      description: row.description ? decryptDescription(row.description) : null,
    };

    // Fetch relations
    const supabase = await createServerClient(accessToken, refreshToken);
    
    const [accountResult, categoryResult, subcategoryResult] = await Promise.all([
      supabase.from("Account").select("id, name, type").eq("id", row.accountId).single(),
      row.categoryId ? supabase.from("Category").select("id, name, groupId").eq("id", row.categoryId).single() : Promise.resolve({ data: null }),
      row.subcategoryId ? supabase.from("Subcategory").select("id, name, logo").eq("id", row.subcategoryId).single() : Promise.resolve({ data: null }),
    ]);

    return TransactionsMapper.toDomainWithRelations(decryptedRow, {
      account: accountResult.data ? { ...accountResult.data, balance: undefined } : null,
      category: categoryResult.data ? { ...categoryResult.data, macro: undefined } : null,
      subcategory: subcategoryResult.data || null,
    });
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    data: TransactionFormData,
    providedUserId?: string
  ): Promise<BaseTransaction> {
    const supabase = await createServerClient();

    // Get user ID
    let userId: string;
    if (providedUserId) {
      // Server-side operation - validate account ownership
      const { data: account } = await supabase
        .from('Account')
        .select('userId')
        .eq('id', data.accountId)
        .single();

      if (!account) {
        throw new AppError("Account not found", 404);
      }

      if (account.userId !== null && account.userId !== providedUserId) {
        throw new AppError("Unauthorized: Account does not belong to user", 401);
      }

      userId = providedUserId;
    } else {
      // Client-side operation
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        throw new AppError("User not authenticated", 401);
      }
      userId = currentUserId;
    }

    // Check transaction limit
    const date = data.date instanceof Date ? data.date : new Date(data.date);
    const limitGuard = await guardTransactionLimit(userId, date);
    await throwIfNotAllowed(limitGuard);

    // Get plan limits
    const { limits } = await getUserSubscriptionData(userId);

    // Prepare data
    const now = formatTimestamp(new Date());
    const transactionDate = formatDateOnly(date);
    const encryptedDescription = encryptDescription(data.description || null);
    const descriptionSearch = normalizeDescription(data.description);

    // Get category suggestion if no category provided
    let categorySuggestion = null;
    if (!data.categoryId && data.description) {
      try {
        categorySuggestion = await suggestCategory(userId, data.description, data.amount, data.type);
      } catch (error) {
        logger.error('Error getting category suggestion:', error);
      }
    }

    const id = crypto.randomUUID();
    const finalCategoryId = data.type === "transfer" ? null : (data.categoryId || null);
    const finalSubcategoryId = data.type === "transfer" ? null : (data.subcategoryId || null);

    // Get active household ID
    const householdId = await getActiveHouseholdId(userId);

    let transactionRow: TransactionRow;

    // Handle transfers with toAccountId using SQL function
    if (data.type === "transfer" && data.toAccountId) {
      const result = await this.repository.createTransferWithLimit({
        userId,
        fromAccountId: data.accountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        date: transactionDate,
        description: encryptedDescription,
        descriptionSearch,
        recurring: data.recurring ?? false,
        maxTransactions: limits.maxTransactions,
      });

      if (!result || !result.id) {
        throw new AppError("Failed to create transfer", 500);
      }

      // Try to fetch the created transaction
      // If not found (due to RLS or timing), construct it from the data we have
      let created = await this.repository.findById(result.id);
      
      if (!created) {
        // Transaction was created but not immediately visible (RLS/timing issue)
        // Construct the transaction row from the data we passed to the function
        logger.warn("[TransactionsService] Transfer created but not immediately fetchable, constructing from data", {
          id: result.id,
          userId,
        });
        
        created = {
          id: result.id,
          date: transactionDate,
          type: 'transfer' as const,
          amount: data.amount,
          accountId: data.accountId,
          categoryId: null,
          subcategoryId: null,
          description: encryptedDescription,
          recurring: data.recurring ?? false,
          expenseType: null,
          transferToId: data.toAccountId || null,
          transferFromId: null,
          createdAt: now,
          updatedAt: now,
          suggestedCategoryId: null,
          suggestedSubcategoryId: null,
          plaidMetadata: null,
          userId,
          householdId,
          tags: null,
        };
      }
      
      transactionRow = created;
    } else {
      // Regular transaction or transfer with transferFromId
      const result = await this.repository.createTransactionWithLimit({
        id,
        userId,
        accountId: data.accountId,
        amount: data.amount,
        date: transactionDate,
        type: data.type,
        description: encryptedDescription,
        descriptionSearch,
        categoryId: finalCategoryId,
        subcategoryId: finalSubcategoryId,
        recurring: data.recurring ?? false,
        expenseType: data.type === "expense" ? (data.expenseType || null) : null,
        maxTransactions: limits.maxTransactions,
        createdAt: now,
        updatedAt: now,
      });

      if (!result || !result.id) {
        throw new AppError("Failed to create transaction", 500);
      }

      // Try to fetch the created transaction
      // If not found (due to RLS or timing), construct it from the data we have
      let created = await this.repository.findById(result.id);
      
      if (!created) {
        // Transaction was created but not immediately visible (RLS/timing issue)
        // Construct the transaction row from the data we passed to the function
        logger.warn("[TransactionsService] Transaction created but not immediately fetchable, constructing from data", {
          id: result.id,
          userId,
        });
        
        created = {
          id: result.id,
          date: transactionDate,
          type: data.type as 'income' | 'expense' | 'transfer',
          amount: data.amount,
          accountId: data.accountId,
          categoryId: finalCategoryId,
          subcategoryId: finalSubcategoryId,
          description: encryptedDescription,
          recurring: data.recurring ?? false,
          expenseType: data.type === "expense" ? (data.expenseType || null) : null,
          transferToId: data.type === "transfer" && data.toAccountId ? data.toAccountId : null,
          transferFromId: null, // Will be set below if needed
          createdAt: now,
          updatedAt: now,
          suggestedCategoryId: null,
          suggestedSubcategoryId: null,
          plaidMetadata: null,
          userId,
          householdId,
          tags: null,
        };
      }
      
      transactionRow = created;

      // Handle transferFromId for incoming transfers (e.g., credit card payments)
      if (data.type === "transfer" && data.transferFromId) {
        await this.repository.update(transactionRow.id, {
          transferFromId: data.transferFromId,
          updatedAt: now,
        });
        transactionRow = await this.repository.findById(transactionRow.id) || transactionRow;
      }
    }

    // Invalidate cache
    invalidateTransactionCaches();

    return TransactionsMapper.toDomain(transactionRow);
  }

  /**
   * Update a transaction
   */
  async updateTransaction(id: string, data: Partial<TransactionFormData>): Promise<BaseTransaction> {
    // Verify ownership
    await requireTransactionOwnership(id);

    const now = formatTimestamp(new Date());
    const updateData: Partial<TransactionRow> = { updatedAt: now };

    // Handle date
    if (data.date !== undefined) {
      const date = data.date instanceof Date ? data.date : new Date(data.date);
      updateData.date = formatDateOnly(date);
    }

    // Handle other fields
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.accountId !== undefined) updateData.accountId = data.accountId;
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.type === "transfer" ? null : (data.categoryId || null);
    }
    if (data.subcategoryId !== undefined) {
      updateData.subcategoryId = data.type === "transfer" ? null : (data.subcategoryId || null);
    }
    if (data.description !== undefined) {
      updateData.description = encryptDescription(data.description || null);
    }
    if (data.recurring !== undefined) updateData.recurring = data.recurring;
    if (data.expenseType !== undefined) {
      updateData.expenseType = data.type === "expense" ? (data.expenseType || null) : null;
    }
    if (data.toAccountId !== undefined) updateData.transferToId = data.toAccountId || null;
    if (data.transferFromId !== undefined) updateData.transferFromId = data.transferFromId || null;

    const row = await this.repository.update(id, updateData);

    // Invalidate cache
    invalidateTransactionCaches();

    return TransactionsMapper.toDomain(row);
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    // Verify ownership
    await requireTransactionOwnership(id);

    await this.repository.delete(id);

    // Invalidate cache
    invalidateTransactionCaches();
  }

  /**
   * Delete multiple transactions
   */
  async deleteMultipleTransactions(ids: string[]): Promise<void> {
    // Verify ownership of all transactions
    for (const id of ids) {
      await requireTransactionOwnership(id);
    }

    await this.repository.deleteMultiple(ids);

    // Invalidate cache
    invalidateTransactionCaches();
  }

  /**
   * Get account balance (helper method)
   */
  async getAccountBalance(accountId: string): Promise<number> {
    const supabase = await createServerClient();

    // Get account initial balance
    const { data: account } = await supabase
      .from("Account")
      .select("initialBalance")
      .eq("id", accountId)
      .single();

    const initialBalance = (account?.initialBalance as number) ?? 0;

    // Get transactions up to today
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const transactions = await this.repository.getTransactionsForBalance(accountId, todayEnd);

    // Calculate balance
    const { decryptTransactionsBatch } = await import("@/lib/utils/transaction-encryption");
    const { calculateAccountBalances } = await import("@/lib/services/balance-calculator");

    const decryptedTransactions = decryptTransactionsBatch(transactions as any);
    const accountsWithInitialBalance = [{
      id: accountId,
      initialBalance,
      balance: 0,
    }];

    const balances = calculateAccountBalances(
      accountsWithInitialBalance as any,
      decryptedTransactions as any,
      todayEnd
    );

    return balances.get(accountId) || initialBalance;
  }

  /**
   * Import multiple transactions (for CSV import)
   */
  async importTransactions(
    userId: string,
    transactions: Array<{
      date: string | Date;
      type: "expense" | "income" | "transfer";
      amount: number;
      accountId: string;
      toAccountId?: string;
      categoryId?: string | null;
      subcategoryId?: string | null;
      description?: string | null;
      recurring?: boolean;
      expenseType?: "fixed" | "variable" | null;
    }>
  ): Promise<{
    imported: number;
    errors: number;
    errorDetails: Array<{ rowIndex: number; fileName?: string; error: string }>;
  }> {
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      throw new AppError("No transactions provided", 400);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ rowIndex: number; fileName?: string; error: string }> = [];

    // Process transactions in batches to avoid rate limiting
    const batchSize = 20;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Process batch with a small delay between batches to avoid rate limiting
      await Promise.allSettled(
        batch.map(async (tx, index) => {
          try {
            // Convert date string to Date object if needed
            const data: TransactionFormData = {
              date: tx.date instanceof Date ? tx.date : new Date(tx.date),
              type: tx.type,
              amount: tx.amount,
              accountId: tx.accountId,
              toAccountId: tx.toAccountId,
              categoryId: tx.categoryId || undefined,
              subcategoryId: tx.subcategoryId || undefined,
              description: tx.description || undefined,
              recurring: tx.recurring || false,
              expenseType: tx.expenseType || undefined,
            };
            
            await this.createTransaction(data, userId);
            successCount++;
          } catch (error) {
            errorCount++;
            let errorMessage = "Unknown error";
            
            if (error instanceof AppError) {
              errorMessage = error.message;
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
            
            errors.push({
              rowIndex: i + index,
              error: errorMessage,
            });
            logger.error("[TransactionsService] Error importing transaction:", error);
          }
        })
      );

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between batches
      }
    }

    return {
      imported: successCount,
      errors: errorCount,
      errorDetails: errors,
    };
  }
}

