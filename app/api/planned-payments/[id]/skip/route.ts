import { NextRequest, NextResponse } from "next/server";
import { skipPlannedPayment } from "@/lib/api/planned-payments";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const plannedPayment = await skipPlannedPayment(id);
    
    return NextResponse.json(plannedPayment, { status: 200 });
  } catch (error) {
    console.error("Error skipping planned payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to skip planned payment";
    const statusCode = errorMessage.includes("Unauthorized") || errorMessage.includes("not found") ? 401 : 400;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

