import { NextRequest, NextResponse } from "next/server";
import { updateDebt, deleteDebt } from "@/lib/api/debts";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const debt = await updateDebt(id, {
      name: data.name,
      loanType: data.loanType,
      initialAmount: data.initialAmount,
      downPayment: data.downPayment,
      currentBalance: data.currentBalance,
      interestRate: data.interestRate,
      totalMonths: data.totalMonths,
      firstPaymentDate: data.firstPaymentDate,
      startDate: data.startDate,
      monthlyPayment: data.monthlyPayment,
      paymentFrequency: data.paymentFrequency,
      paymentAmount: data.paymentAmount,
      principalPaid: data.principalPaid,
      interestPaid: data.interestPaid,
      additionalContributions: data.additionalContributions,
      additionalContributionAmount: data.additionalContributionAmount,
      priority: data.priority,
      description: data.description,
      accountId: data.accountId,
      isPaused: data.isPaused,
    });
    
    return NextResponse.json(debt, { status: 200 });
  } catch (error) {
    console.error("Error updating debt:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update debt";
    const statusCode = errorMessage.includes("Unauthorized") || errorMessage.includes("not found") ? 401 : 400;
    
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
    
    await deleteDebt(id);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting debt:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete debt";
    const statusCode = errorMessage.includes("Unauthorized") || errorMessage.includes("not found") ? 401 : 400;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}




