import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getTransactions } from "@/lib/api/transactions";
import { createTransaction } from "@/lib/api/transactions";
import { TransactionFormData } from "@/lib/validations/transaction";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const recurring = searchParams.get("recurring");

    const transactions = await getTransactions({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      categoryId: categoryId || undefined,
      accountId: accountId || undefined,
      type: type || undefined,
      search: search || undefined,
      recurring: recurring === "true" ? true : recurring === "false" ? false : undefined,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication and limits
    const { createServerClient } = await import("@/lib/supabase-server");
    const { checkTransactionLimit } = await import("@/lib/api/limits");
    
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check transaction limit
    const limitCheck = await checkTransactionLimit(authUser.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || "Transaction limit reached" },
        { status: 403 }
      );
    }

    const body = await request.json();
    // Convert date string to Date object if needed
    const data: TransactionFormData = {
      ...body,
      date: body.date instanceof Date ? body.date : new Date(body.date),
    };
    const transaction = await createTransaction(data);
    // Revalidate cache
    revalidateTag('transactions');
    revalidateTag('budgets');
    revalidateTag('financial-health');
    revalidateTag('goals');
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    const message = error instanceof Error ? error.message : "Failed to create transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

