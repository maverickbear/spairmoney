import { NextResponse } from "next/server";
import { addTopUp } from "@/lib/api/goals";

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

    const goal = await addTopUp(id, amount);
    return NextResponse.json(goal);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add top-up";
    console.error("API error adding top-up:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

