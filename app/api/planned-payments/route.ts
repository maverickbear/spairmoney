import { NextRequest, NextResponse } from "next/server";
import { createPlannedPayment } from "@/lib/api/planned-payments";
import { PlannedPaymentFormData } from "@/lib/api/planned-payments";

export async function POST(request: NextRequest) {
  try {
    const data: PlannedPaymentFormData = await request.json();
    
    const plannedPayment = await createPlannedPayment(data);
    
    return NextResponse.json(plannedPayment, { status: 201 });
  } catch (error) {
    console.error("Error creating planned payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create planned payment";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 400;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

