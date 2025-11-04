import { NextResponse } from "next/server";
import { updateBudget, deleteBudget } from "@/lib/api/budgets";
import { BudgetFormData } from "@/lib/validations/budget";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const budget = await updateBudget(id, data as { amount: number; note?: string });
    return NextResponse.json(budget);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteBudget(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}

