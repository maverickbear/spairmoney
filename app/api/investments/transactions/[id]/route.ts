import { NextResponse } from "next/server";
import {
  updateInvestmentTransaction,
  deleteInvestmentTransaction,
} from "@/lib/api/investments";
import { investmentTransactionSchema } from "@/lib/validations/investment";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = {
      ...body,
      date: new Date(body.date),
    };
    const validated = investmentTransactionSchema.partial().parse(data);
    const transaction = await updateInvestmentTransaction(id, validated);
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating investment transaction:", error);
    const message = error instanceof Error ? error.message : "Failed to update investment transaction";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteInvestmentTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting investment transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete investment transaction" },
      { status: 500 }
    );
  }
}

