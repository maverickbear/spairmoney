"use server";

import { createServerClient } from "@/lib/supabase-server";
import { formatTimestamp, formatDateStart, formatDateEnd } from "@/lib/utils/timestamp";

export async function getBudgets(period: Date) {
  const supabase = createServerClient();

  const startOfMonth = new Date(period.getFullYear(), period.getMonth(), 1);
  const endOfMonth = new Date(period.getFullYear(), period.getMonth() + 1, 0, 23, 59, 59);

  const { data: budgets, error } = await supabase
    .from("Budget")
    .select(`
      *,
      category:Category(
        *,
        macro:Macro(*)
      ),
      macro:Macro(*),
      budgetCategories:BudgetCategory(
        category:Category(
          *
        )
      )
    `)
    .gte("period", formatDateStart(startOfMonth))
    .lte("period", formatDateEnd(endOfMonth));

  if (error) {
    console.error("Supabase error fetching budgets:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return [];
  }

  if (!budgets) {
    return [];
  }

  // Supabase returns relations as arrays, so we need to handle that
  const processedBudgets = budgets.map((budget: any) => {
    const category = Array.isArray(budget.category) ? budget.category[0] : budget.category;
    const categoryMacro = category && Array.isArray(category.macro) ? category.macro[0] : category?.macro;
    const macro = Array.isArray(budget.macro) ? budget.macro[0] : budget.macro;
    const budgetCategories = Array.isArray(budget.budgetCategories) ? budget.budgetCategories : [];
    
    return {
      ...budget,
      category: category ? {
        ...category,
        macro: categoryMacro || null,
      } : null,
      macro: macro || null,
      budgetCategories: budgetCategories.map((bc: any) => ({
        ...bc,
        category: Array.isArray(bc.category) ? bc.category[0] : bc.category,
      })),
    };
  });

  // Calculate actual spend for each budget
  const budgetsWithActual = await Promise.all(
    processedBudgets.map(async (budget) => {
      let actualSpend = 0;
      
      if (budget.macroId && budget.budgetCategories && budget.budgetCategories.length > 0) {
        // Budget grouped by macro: sum transactions from all related categories
        const categoryIds = budget.budgetCategories
          .map((bc: any) => bc.category?.id)
          .filter((id: string) => id);
        
        if (categoryIds.length > 0) {
          const { data: transactions } = await supabase
            .from("Transaction")
            .select("amount")
            .in("categoryId", categoryIds)
            .eq("type", "expense")
            .gte("date", formatDateStart(startOfMonth))
            .lte("date", formatDateEnd(endOfMonth));

          actualSpend = transactions?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0;
        }
      } else if (budget.categoryId) {
        // Single category budget: sum transactions from that category
        const { data: transactions } = await supabase
          .from("Transaction")
          .select("amount")
          .eq("categoryId", budget.categoryId)
          .eq("type", "expense")
          .gte("date", formatDateStart(startOfMonth))
          .lte("date", formatDateEnd(endOfMonth));

        actualSpend = transactions?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0;
      }

      const percentage = budget.amount > 0 ? (actualSpend / budget.amount) * 100 : 0;

      let status: "ok" | "warning" | "over" = "ok";
      if (percentage > 100) {
        status = "over";
      } else if (percentage > 90) {
        status = "warning";
      }

      // For grouped budgets, use macro name; for single category, use category name
      const displayName = budget.macro?.name || budget.category?.name || "Unknown";
      const displayCategory = budget.macro ? {
        id: budget.macroId,
        name: budget.macro.name,
        macroId: budget.macro.id,
        macro: budget.macro,
      } : (budget.category || { id: budget.categoryId, name: "Unknown", macroId: "", macro: null });

      return {
        ...budget,
        actualSpend,
        percentage,
        status,
        category: displayCategory,
        displayName,
        macro: budget.macro || null,
        budgetCategories: budget.budgetCategories || [],
      };
    })
  );

  return budgetsWithActual;
}

export async function createBudget(data: {
  period: Date;
  categoryId?: string;
  macroId?: string;
  categoryIds?: string[];
  amount: number;
  note?: string;
}) {
  const supabase = createServerClient();

  const id = crypto.randomUUID();
  const startOfMonth = new Date(data.period.getFullYear(), data.period.getMonth(), 1);
  const periodDate = formatTimestamp(startOfMonth);
  const now = formatTimestamp(new Date());

  // If multiple categories are provided, create a grouped budget with macroId
  const isGrouped = data.categoryIds && data.categoryIds.length > 1;
  
  if (isGrouped && !data.macroId) {
    throw new Error("macroId is required when creating a grouped budget");
  }

  // Create the budget
  const budgetData: Record<string, unknown> = {
    id,
    period: periodDate,
    amount: data.amount,
    note: data.note || null,
    createdAt: now,
    updatedAt: now,
  };

  if (isGrouped) {
    // Grouped budget: use macroId, categoryId is null
    budgetData.macroId = data.macroId;
    budgetData.categoryId = null;
  } else {
    // Single category budget: use categoryId, macroId is null
    budgetData.categoryId = data.categoryId || data.categoryIds?.[0];
    budgetData.macroId = null;
  }

  const { data: budget, error } = await supabase
    .from("Budget")
    .insert(budgetData)
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating budget:", error);
    // Check if it's a unique constraint violation (budget already exists)
    if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
      const budgetType = isGrouped ? "group" : "category";
      throw new Error(`Budget already exists for this ${budgetType} in this period`);
    }
    throw new Error(`Failed to create budget: ${error.message || JSON.stringify(error)}`);
  }

  // If grouped, create BudgetCategory relationships
  if (isGrouped && data.categoryIds && data.categoryIds.length > 0) {
    const budgetCategories = data.categoryIds.map((categoryId) => ({
      id: crypto.randomUUID(),
      budgetId: budget.id,
      categoryId,
      createdAt: now,
    }));

    const { error: bcError } = await supabase
      .from("BudgetCategory")
      .insert(budgetCategories);

    if (bcError) {
      console.error("Supabase error creating budget categories:", bcError);
      // Try to clean up the budget if category creation fails
      await supabase.from("Budget").delete().eq("id", budget.id);
      throw new Error(`Failed to create budget categories: ${bcError.message || JSON.stringify(bcError)}`);
    }
  }

  return budget;
}

export async function updateBudget(id: string, data: { amount: number; note?: string }) {
  const supabase = createServerClient();

  const updateData: Record<string, unknown> = {
    amount: data.amount,
    updatedAt: formatTimestamp(new Date()),
  };
  if (data.note !== undefined) {
    updateData.note = data.note || null;
  }

  const { data: budget, error } = await supabase
    .from("Budget")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase error updating budget:", error);
    throw new Error(`Failed to update budget: ${error.message || JSON.stringify(error)}`);
  }

  return budget;
}

export async function deleteBudget(id: string) {
  const supabase = createServerClient();

  const { error } = await supabase.from("Budget").delete().eq("id", id);

  if (error) {
    console.error("Supabase error deleting budget:", error);
    throw new Error(`Failed to delete budget: ${error.message || JSON.stringify(error)}`);
  }
}
