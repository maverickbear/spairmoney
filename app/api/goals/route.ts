import { NextRequest, NextResponse } from "next/server";
import { getGoals, createGoal } from "@/lib/api/goals";

export async function GET(request: NextRequest) {
  try {
    const goals = await getGoals();
    console.log("[API/GOALS] Goals fetched:", goals?.length || 0, "goals");
    return NextResponse.json(goals, { status: 200 });
  } catch (error) {
    console.error("[API/GOALS] Error fetching goals:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch goals";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const goal = await createGoal({
      name: body.name,
      targetAmount: body.targetAmount,
      currentBalance: body.currentBalance,
      incomePercentage: body.incomePercentage,
      priority: body.priority,
      description: body.description,
      isPaused: body.isPaused,
      expectedIncome: body.expectedIncome,
      targetMonths: body.targetMonths,
    });
    
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to create goal";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 400;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

