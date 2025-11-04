import { NextResponse } from "next/server";
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
    const body = await request.json();
    // Convert date string to Date object if needed
    const data: TransactionFormData = {
      ...body,
      date: body.date instanceof Date ? body.date : new Date(body.date),
    };
    const transaction = await createTransaction(data);
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    const message = error instanceof Error ? error.message : "Failed to create transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

