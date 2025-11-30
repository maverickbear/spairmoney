import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { getTransactionAmount, decryptDescription } from "@/src/infrastructure/utils/transaction-encryption";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/transactions/by-ids
 * Get transactions by their IDs
 * Note: This is an auxiliary route. Consider using TransactionsService.getTransactions() with filters instead.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Fetch transactions by IDs
    const { data: transactions, error } = await supabase
      .from("Transaction")
      .select(`
        id,
        date,
        amount,
        description,
        accountId,
        account:Account(id, name)
      `)
      .in("id", ids)
      .eq("userId", userId) // Ensure user can only access their own transactions
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      throw new AppError("Failed to fetch transactions", 500);
    }

    // Decrypt descriptions and format amounts
    interface TransactionWithAccount {
      id: string;
      date: string;
      amount: number | string;
      description: string | null;
      account: { id: string; name: string } | { id: string; name: string }[] | null;
    }

    const formattedTransactions = (transactions || []).map((tx: TransactionWithAccount) => ({
      id: tx.id,
      date: tx.date,
      amount: getTransactionAmount(tx.amount) ?? 0,
      description: decryptDescription(tx.description),
      account: Array.isArray(tx.account) ? tx.account[0] : tx.account,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error in POST /api/transactions/by-ids:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
