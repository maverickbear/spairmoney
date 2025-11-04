import { NextResponse } from "next/server";
import { calculateIncomeBasis } from "@/lib/api/goals";

export async function GET() {
  try {
    const incomeBasis = await calculateIncomeBasis();
    return NextResponse.json({ incomeBasis });
  } catch (error) {
    console.error("Error calculating income basis:", error);
    return NextResponse.json(
      { error: "Failed to calculate income basis" },
      { status: 500 }
    );
  }
}

