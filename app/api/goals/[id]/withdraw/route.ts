import { NextResponse } from "next/server";
import { withdraw } from "@/lib/api/goals";

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
        { error: "Amount must be positive" },
        { status: 400 }
      );
    }

    const goal = await withdraw(id, amount);
    return NextResponse.json(goal);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to withdraw";
    console.error("API error withdrawing from goal:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

