import { NextResponse } from "next/server";
import { getGoals, createGoal } from "@/lib/api/goals";

export async function GET() {
  try {
    const goals = await getGoals();
    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const goal = await createGoal(data);
    return NextResponse.json(goal);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create goal";
    console.error("API error creating goal:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

