import { NextResponse } from "next/server";
import { addPayment } from "@/lib/api/debts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { amount } = data;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be positive" },
        { status: 400 }
      );
    }

    const debt = await addPayment(id, amount);
    return NextResponse.json(debt);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add payment";
    console.error("API error adding payment:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

