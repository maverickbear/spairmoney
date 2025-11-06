import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { updateGoal, deleteGoal } from "@/lib/api/goals";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const goal = await updateGoal(id, data);
    revalidateTag('goals');
    revalidateTag('financial-health');
    return NextResponse.json(goal);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update goal";
    console.error("API error updating goal:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteGoal(id);
    revalidateTag('goals');
    revalidateTag('financial-health');
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete goal";
    console.error("API error deleting goal:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

