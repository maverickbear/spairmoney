import { NextRequest, NextResponse } from "next/server";
import { makeTransactionsService } from "@/src/application/transactions/transactions.factory";
import { AppError } from "@/src/application/shared/app-error";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";

/**
 * POST /api/transactions/[id]/apply-suggestion
 * Apply suggested category to a transaction
 * This endpoint moves the suggested category to the actual category
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createServerClient();
    
    // Get the transaction to check for suggested category
    const { data: transaction, error: fetchError } = await supabase
      .from("Transaction")
      .select("suggestedCategoryId, suggestedSubcategoryId")
      .eq("id", id)
      .single();
    
    if (fetchError || !transaction) {
      throw new AppError("Transaction not found", 404);
    }
    
    if (!transaction.suggestedCategoryId) {
      throw new AppError("No suggested category found for this transaction", 400);
    }
    
    // Apply the suggestion by moving it to the actual category
    const service = makeTransactionsService();
    const updatedTransaction = await service.updateTransaction(id, {
      categoryId: transaction.suggestedCategoryId,
      subcategoryId: transaction.suggestedSubcategoryId || undefined,
    });
    
    // Clear suggested fields
    await supabase
      .from("Transaction")
      .update({
        suggestedCategoryId: null,
        suggestedSubcategoryId: null,
      })
      .eq("id", id);
    
    return NextResponse.json(updatedTransaction, { status: 200 });
  } catch (error) {
    console.error("Error applying suggestion:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply suggestion" },
      { status: 500 }
    );
  }
}

