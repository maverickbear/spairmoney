import { NextResponse } from "next/server";
import { getDebts, createDebt } from "@/lib/api/debts";

export async function GET() {
  try {
    const debts = await getDebts();
    return NextResponse.json(debts);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json(
      { error: "Failed to fetch debts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const debt = await createDebt(data);
    return NextResponse.json(debt);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create debt";
    console.error("API error creating debt:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

