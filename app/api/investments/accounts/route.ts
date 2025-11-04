import { NextResponse } from "next/server";
import { getInvestmentAccounts, createInvestmentAccount } from "@/lib/api/investments";
import { investmentAccountSchema } from "@/lib/validations/investment";

export async function GET() {
  try {
    const accounts = await getInvestmentAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching investment accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch investment accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = investmentAccountSchema.parse(body);
    const account = await createInvestmentAccount(validated);
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating investment account:", error);
    const message = error instanceof Error ? error.message : "Failed to create investment account";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

