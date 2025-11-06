import { NextResponse } from "next/server";
import { updateDebt, deleteDebt, getDebts } from "@/lib/api/debts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debts = await getDebts();
    const debt = debts.find((d) => d.id === id);
    
    if (!debt) {
      return NextResponse.json(
        { error: "Debt not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(debt);
  } catch (error) {
    console.error("Error fetching debt:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const debt = await updateDebt(id, data);
    return NextResponse.json(debt);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update debt";
    console.error("API error updating debt:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDebt(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete debt";
    console.error("API error deleting debt:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

