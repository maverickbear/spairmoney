/**
 * Budgets Service
 * Business logic for budget management
 */

import { BudgetsRepository } from "@/src/infrastructure/database/repositories/budgets.repository";
import { CategoriesRepository } from "@/src/infrastructure/database/repositories/categories.repository";
import { TransactionsRepository } from "@/src/infrastructure/database/repositories/transactions.repository";
import { BudgetsMapper } from "./budgets.mapper";
import { BudgetFormData } from "../../domain/budgets/budgets.validations";
import { BaseBudget, BudgetWithRelations } from "../../domain/budgets/budgets.types";
import { formatTimestamp } from "@/lib/utils/timestamp";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { requireBudgetOwnership } from "@/lib/utils/security";
import { logger } from "@/lib/utils/logger";
import { getTransactionAmount } from "@/lib/utils/transaction-encryption";
import { AppError } from "../shared/app-error";
import { getCurrentUserId } from "../shared/feature-guard";
import { makeMembersService } from "../members/members.factory";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";

export class BudgetsService {
  constructor(
    private repository: BudgetsRepository,
    private categoriesRepository: CategoriesRepository,
    private transactionsRepository: TransactionsRepository
  ) {}

  /**
   * Get budgets for a period
   */
  async getBudgets(
    period: Date,
    accessToken?: string,
    refreshToken?: string
  ): Promise<BudgetWithRelations[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    // OPTIMIZATION: Check if there are any budgets first (fast query)
    // Fetch budgets first to see if we need to do expensive operations
    let rows = await this.repository.findAllByPeriod(period, accessToken, refreshToken);

    // OPTIMIZATION: Only ensure recurring budgets if we have no budgets
    // Skip if we already have budgets (they're already created)
    if (rows.length === 0) {
      // Quick check if user has any recurring budgets at all (very fast query)
      const supabase = await createServerClient(accessToken, refreshToken);
      const { data: hasRecurring } = await supabase
        .from("Budget")
        .select("id")
        .eq("userId", userId)
        .eq("isRecurring", true)
        .limit(1)
        .maybeSingle();

      // Only run expensive ensureRecurringBudgetsForPeriod if user has recurring budgets
      if (hasRecurring) {
        await this.ensureRecurringBudgetsForPeriod(period, accessToken, refreshToken);
        // Re-fetch after ensuring recurring budgets
        rows = await this.repository.findAllByPeriod(period, accessToken, refreshToken);
      }
    }

    // Early return if no budgets
    if (rows.length === 0) {
      return [];
    }

    // Fetch related data
    const categoryIds = [...new Set(rows.map(b => b.categoryId).filter(Boolean) as string[])];
    const subcategoryIds = [...new Set(rows.map(b => b.subcategoryId).filter(Boolean) as string[])];
    const groupIds = [...new Set(rows.map(b => b.groupId).filter(Boolean) as string[])];

    // OPTIMIZATION: Fetch categories/subcategories/groups first (needed for mapping)
    // Then fetch transactions in parallel with mapping operations
    const periodStart = new Date(period.getFullYear(), period.getMonth(), 1);
    const periodEnd = new Date(period.getFullYear(), period.getMonth() + 1, 0, 23, 59, 59);

    // Fetch categories, subcategories, and groups first (needed for transaction processing)
    const [categories, subcategories, groups] = await Promise.all([
      categoryIds.length > 0 
        ? this.categoriesRepository.findCategoriesByIds(categoryIds, accessToken, refreshToken)
        : Promise.resolve([]),
      subcategoryIds.length > 0
        ? this.categoriesRepository.findSubcategoriesByIds(subcategoryIds, accessToken, refreshToken)
        : Promise.resolve([]),
      groupIds.length > 0
        ? this.categoriesRepository.findGroupsByIds(groupIds, accessToken, refreshToken)
        : Promise.resolve([]),
    ]);

    // Create maps early for transaction processing
    const categoriesMap = new Map();
    categories.forEach((cat) => {
      categoriesMap.set(cat.id, cat);
    });

    const subcategoriesMap = new Map();
    subcategories.forEach((sub) => {
      subcategoriesMap.set(sub.id, sub);
    });

    const groupsMap = new Map();
    groups.forEach((group) => {
      groupsMap.set(group.id, group);
    });

    // OPTIMIZATION: Quick check if there are any expense transactions in the period
    // If no transactions, skip expensive query and return budgets with zero actualSpend
    const supabaseCheck = await createServerClient(accessToken, refreshToken);
    const startDateStr = periodStart.toISOString().split('T')[0];
    const endDateStr = periodEnd.toISOString().split('T')[0];
    
    const { count, error: countError } = await supabaseCheck
      .from("Transaction")
      .select("*", { count: 'exact', head: true })
      .eq("type", "expense")
      .not("categoryId", "is", null)
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    // If no transactions or error, skip fetching full transaction data
    let transactions: Array<{ categoryId: string; subcategoryId: string | null; amount: number }> = [];
    if (!countError && count && count > 0) {
      // Only fetch full transaction data if there are transactions
      transactions = await this.fetchTransactionsForBudgets(periodStart, periodEnd, accessToken, refreshToken);
    }

    // OPTIMIZATION: Pre-calculate spend maps instead of filtering for each budget
    // This reduces complexity from O(n*m) to O(n+m) where n=transactions, m=budgets
    const categorySpendMap = new Map<string, number>();
    const subcategorySpendMap = new Map<string, number>();
    const groupSpendMap = new Map<string, number>();

    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        // OPTIMIZATION: Amounts are always numbers now, no need for complex decryption
        const amount = typeof tx.amount === 'number' ? tx.amount : (getTransactionAmount(tx.amount) || 0);
        const absAmount = Math.abs(amount);

        // Add to category spend
        if (tx.categoryId) {
          const currentCategoryTotal = categorySpendMap.get(tx.categoryId) || 0;
          categorySpendMap.set(tx.categoryId, currentCategoryTotal + absAmount);

          // Also add to group spend if category belongs to a group
          const category = categoriesMap.get(tx.categoryId);
          if (category?.groupId) {
            const currentGroupTotal = groupSpendMap.get(category.groupId) || 0;
            groupSpendMap.set(category.groupId, currentGroupTotal + absAmount);
          }
        }

        // Add to subcategory spend
        if (tx.subcategoryId) {
          const currentSubcategoryTotal = subcategorySpendMap.get(tx.subcategoryId) || 0;
          subcategorySpendMap.set(tx.subcategoryId, currentSubcategoryTotal + absAmount);
        }
      }
    }

    // Calculate actual spend per budget using pre-calculated maps
    const budgets: BudgetWithRelations[] = rows.map(row => {
      const category = row.categoryId ? categoriesMap.get(row.categoryId) : null;
      const subcategory = row.subcategoryId ? subcategoriesMap.get(row.subcategoryId) : null;
      const group = row.groupId ? groupsMap.get(row.groupId) : null;

      // Calculate actual spend using pre-calculated maps
      let actualSpend = 0;
      if (row.groupId) {
        // Group budget - use group spend map
        actualSpend = groupSpendMap.get(row.groupId) || 0;
      } else if (row.subcategoryId) {
        // Subcategory budget - use subcategory spend map
        actualSpend = subcategorySpendMap.get(row.subcategoryId) || 0;
      } else if (row.categoryId) {
        // Category budget - use category spend map
        actualSpend = categorySpendMap.get(row.categoryId) || 0;
      }

      const percentage = row.amount > 0 ? (actualSpend / row.amount) * 100 : 0;
      const status: "ok" | "warning" | "over" = 
        percentage >= 100 ? "over" : 
        percentage >= 80 ? "warning" : 
        "ok";

      return BudgetsMapper.toDomainWithRelations(row, {
        category: category ? { ...category, group: group ? { id: group.id, name: group.name } : null } : null,
        subcategory: subcategory || null,
        group: group ? { id: group.id, name: group.name } : null,
        actualSpend,
        percentage,
        status,
      });
    });

    return budgets;
  }

  /**
   * Fetch transactions optimized for budget calculations
   * Only selects necessary fields and filters by categoryId IS NOT NULL at DB level
   * OPTIMIZATION: Uses minimal fields to reduce data transfer
   */
  private async fetchTransactionsForBudgets(
    periodStart: Date,
    periodEnd: Date,
    accessToken?: string,
    refreshToken?: string
  ): Promise<Array<{ categoryId: string; subcategoryId: string | null; amount: number }>> {
    const supabase = await createServerClient(accessToken, refreshToken);
    
    const startDateStr = periodStart.toISOString().split('T')[0];
    const endDateStr = periodEnd.toISOString().split('T')[0];

    // OPTIMIZATION: Only select necessary fields, filter at DB level, and order by date ascending for better index usage
    const { data: transactionRows, error } = await supabase
      .from("Transaction")
      .select("categoryId, subcategoryId, amount")
      .eq("type", "expense")
      .not("categoryId", "is", null)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: true }); // Use index-friendly ordering

    if (error) {
      logger.warn("[BudgetsService] Error fetching transactions for budgets:", error);
      return [];
    }

    if (!transactionRows || transactionRows.length === 0) {
      return [];
    }

    // Map to simplified format (amounts are always numbers now)
    return transactionRows.map(tx => ({
      categoryId: tx.categoryId as string,
      subcategoryId: (tx.subcategoryId as string | null) || null,
      amount: typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0,
    }));
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(
    id: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<BudgetWithRelations | null> {
    const row = await this.repository.findById(id, accessToken, refreshToken);
    
    if (!row) {
      return null;
    }

    // Fetch relations using repository
    const [category, subcategory, group] = await Promise.all([
      row.categoryId ? this.categoriesRepository.findCategoryById(row.categoryId, accessToken, refreshToken) : Promise.resolve(null),
      row.subcategoryId ? this.categoriesRepository.findSubcategoryById(row.subcategoryId, accessToken, refreshToken) : Promise.resolve(null),
      row.groupId ? this.categoriesRepository.findGroupById(row.groupId, accessToken, refreshToken) : Promise.resolve(null),
    ]);

    return BudgetsMapper.toDomainWithRelations(row, {
      category: category ? { id: category.id, name: category.name, groupId: category.groupId, group: null } : null,
      subcategory: subcategory ? { id: subcategory.id, name: subcategory.name } : null,
      group: group ? { id: group.id, name: group.name } : null,
    });
  }

  /**
   * Create a new budget
   */
  async createBudget(data: BudgetFormData): Promise<BaseBudget> {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Format period
    const periodDate = data.period instanceof Date ? data.period : new Date(data.period);
    const periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const periodStr = formatTimestamp(periodStart);

    // Support both groupId and deprecated macroId
    const groupId = data.groupId || data.macroId || null;

    // Check if budget already exists
    const exists = await this.repository.existsForPeriod(
      periodStr,
      data.categoryId || null,
      data.subcategoryId || null,
      groupId,
      userId
    );

    if (exists) {
      throw new AppError("Budget already exists for this period and category", 409);
    }

    const id = crypto.randomUUID();
    const now = formatTimestamp(new Date());
    const membersService = makeMembersService();
    const householdId = await membersService.getActiveHouseholdId(userId);

    const budgetRow = await this.repository.create({
      id,
      period: periodStr,
      amount: data.amount,
      categoryId: data.categoryId || null,
      subcategoryId: data.subcategoryId || null,
      groupId,
      userId,
      note: null,
      isRecurring: false,
      createdAt: now,
      updatedAt: now,
    });


    return BudgetsMapper.toDomain(budgetRow);
  }

  /**
   * Check if a budget is pre-filled (created during onboarding)
   * Note: Currently budgets don't have a note field, so this is a placeholder
   * In the future, we could add a flag or use the note field to mark pre-filled budgets
   */
  isPreFilled(budget: BaseBudget): boolean {
    // For now, we can't determine if a budget is pre-filled
    // This method is here for future enhancement
    return false;
  }

  /**
   * Update a budget
   */
  async updateBudget(id: string, data: { amount: number }): Promise<BaseBudget> {
    // Verify ownership
    await requireBudgetOwnership(id);

    const now = formatTimestamp(new Date());

    const budgetRow = await this.repository.update(id, {
      amount: data.amount,
      updatedAt: now,
    });


    return BudgetsMapper.toDomain(budgetRow);
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    // Verify ownership
    await requireBudgetOwnership(id);

    await this.repository.delete(id);

  }

  /**
   * Ensure recurring budgets are created for a period
   * OPTIMIZATION: Batch check existence and create in single operations
   */
  private async ensureRecurringBudgetsForPeriod(
    period: Date,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const targetPeriod = new Date(period.getFullYear(), period.getMonth(), 1);
    const targetPeriodStr = formatTimestamp(targetPeriod);

    // OPTIMIZATION: Quick check - if we already have budgets for this period, skip expensive recurring check
    const existingBudgets = await this.repository.findAllByPeriod(period, accessToken, refreshToken);
    if (existingBudgets.length > 0) {
      // Already have budgets, likely no need to create recurring ones
      return;
    }

    // OPTIMIZATION: Quick check if user has any recurring budgets at all (very fast query with limit 1)
    const supabase = await createServerClient(accessToken, refreshToken);
    const { data: hasRecurring, error } = await supabase
      .from("Budget")
      .select("id")
      .eq("userId", userId)
      .eq("isRecurring", true)
      .limit(1)
      .maybeSingle();

    if (error || !hasRecurring) {
      // No recurring budgets, skip expensive operations
      return;
    }

    // Get recurring budgets before this period
    const recurringBudgets = await this.repository.findRecurringBudgetsBeforePeriod(targetPeriod, userId, accessToken, refreshToken);

    if (recurringBudgets.length === 0) {
      return;
    }

    // Group by unique key and get the most recent one for each
    const recurringBudgetsMap = new Map<string, any>();
    for (const budget of recurringBudgets) {
      const key = budget.groupId 
        ? `group:${budget.groupId}` 
        : budget.subcategoryId 
          ? `cat:${budget.categoryId}:sub:${budget.subcategoryId}` 
          : `cat:${budget.categoryId}`;
      
      if (!recurringBudgetsMap.has(key)) {
        recurringBudgetsMap.set(key, budget);
      }
    }

    const uniqueRecurringBudgets = Array.from(recurringBudgetsMap.values());

    // OPTIMIZATION: Fetch all existing budgets for the period using repository
    const existingBudgetsRows = await this.repository.findAllByPeriod(period, accessToken, refreshToken);

    // Create a set of existing budget keys for O(1) lookup
    const existingKeys = new Set(
      existingBudgetsRows.map((b) => 
        b.groupId 
          ? `group:${b.groupId}` 
          : b.subcategoryId 
            ? `cat:${b.categoryId}:sub:${b.subcategoryId}` 
            : `cat:${b.categoryId}`
      )
    );

    // Filter out budgets that already exist
    const budgetsToCreate = uniqueRecurringBudgets.filter(budget => {
      const key = budget.groupId 
        ? `group:${budget.groupId}` 
        : budget.subcategoryId 
          ? `cat:${budget.categoryId}:sub:${budget.subcategoryId}` 
          : `cat:${budget.categoryId}`;
      return !existingKeys.has(key);
    });
    
    if (budgetsToCreate.length > 0) {
      const now = formatTimestamp(new Date());
      const householdId = await getActiveHouseholdId(userId);

      // Create all missing budgets in parallel
      await Promise.all(
        budgetsToCreate.map(budget => {
          const newId = crypto.randomUUID();
          return this.repository.create({
            id: newId,
            period: targetPeriodStr,
            amount: budget.amount,
            categoryId: budget.categoryId,
            subcategoryId: budget.subcategoryId,
            groupId: budget.groupId,
            userId,
            note: budget.note,
            isRecurring: true,
            createdAt: now,
            updatedAt: now,
          });
        })
      );
    }
  }
}

