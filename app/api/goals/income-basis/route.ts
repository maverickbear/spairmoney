import { NextRequest, NextResponse } from "next/server";
import { calculateIncomeBasis } from "@/lib/api/goals";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expectedIncome = searchParams.get("expectedIncome");
    
    const incomeBasis = await calculateIncomeBasis(
      expectedIncome ? parseFloat(expectedIncome) : undefined
    );
    
    return NextResponse.json({ incomeBasis }, { status: 200 });
  } catch (error) {
    console.error("Error calculating income basis:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to calculate income basis";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

