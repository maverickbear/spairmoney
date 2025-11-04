import { NextResponse } from "next/server";
import {
  getInvestmentTransactions,
  createInvestmentTransaction,
} from "@/lib/api/investments";
import { investmentTransactionSchema } from "@/lib/validations/investment";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;
    const securityId = searchParams.get("securityId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    const transactions = await getInvestmentTransactions({
      accountId,
      securityId,
      startDate,
      endDate,
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching investment transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch investment transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = {
      ...body,
      date: new Date(body.date),
    };
    const validated = investmentTransactionSchema.parse(data);
    const transaction = await createInvestmentTransaction(validated);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating investment transaction:", error);
    const message = error instanceof Error ? error.message : "Failed to create investment transaction";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

