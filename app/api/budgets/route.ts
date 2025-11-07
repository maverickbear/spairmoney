import { NextRequest, NextResponse } from "next/server";
import { createBudget } from "@/lib/api/budgets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert period from ISO string to Date
    const period = body.period ? new Date(body.period) : new Date();
    
    const budget = await createBudget({
      period,
      categoryId: body.categoryId,
      macroId: body.macroId,
      categoryIds: body.categoryIds,
      amount: body.amount,
      note: body.note,
    });
    
    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "Failed to create budget";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 400;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

