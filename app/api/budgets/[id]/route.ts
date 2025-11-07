import { NextRequest, NextResponse } from "next/server";
import { updateBudget, deleteBudget } from "@/lib/api/budgets";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const budget = await updateBudget(id, {
      amount: data.amount,
      note: data.note,
    });
    
    return NextResponse.json(budget, { status: 200 });
  } catch (error) {
    console.error("Error updating budget:", error);
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "Failed to update budget";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 400;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await deleteBudget(id);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete budget" },
      { status: 400 }
    );
  }
}

