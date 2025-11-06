import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { updateTransaction, deleteTransaction } from "@/lib/api/transactions";
import { TransactionFormData } from "@/lib/validations/transaction";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    // Convert date string to Date object if needed
    const data: Partial<TransactionFormData> = {
      ...body,
      date: body.date ? (body.date instanceof Date ? body.date : new Date(body.date)) : undefined,
    };
    const transaction = await updateTransaction(id, data);
    // Revalidate cache
    revalidateTag('transactions', 'max');
    revalidateTag('budgets', 'max');
    revalidateTag('financial-health', 'max');
    revalidateTag('goals', 'max');
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    const message = error instanceof Error ? error.message : "Failed to update transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTransaction(id);
    // Revalidate cache
    revalidateTag('transactions', 'max');
    revalidateTag('budgets', 'max');
    revalidateTag('financial-health', 'max');
    revalidateTag('goals', 'max');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

