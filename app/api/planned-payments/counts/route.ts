import { NextRequest, NextResponse } from "next/server";
import { getPlannedPayments, PLANNED_HORIZON_DAYS } from "@/lib/api/planned-payments";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizonDate = new Date(today);
    horizonDate.setDate(horizonDate.getDate() + PLANNED_HORIZON_DAYS);
    
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : today;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : horizonDate;
    const status = (searchParams.get("status") || "scheduled") as "scheduled" | "paid" | "skipped" | "cancelled";
    
    // Get counts for each type in parallel (using limit=1, page=1 to get only total)
    const [expenseResult, incomeResult, transferResult] = await Promise.all([
      getPlannedPayments({
        startDate,
        endDate,
        status,
        type: "expense",
        limit: 1,
        page: 1,
      }),
      getPlannedPayments({
        startDate,
        endDate,
        status,
        type: "income",
        limit: 1,
        page: 1,
      }),
      getPlannedPayments({
        startDate,
        endDate,
        status,
        type: "transfer",
        limit: 1,
        page: 1,
      }),
    ]);
    
    return NextResponse.json({
      expense: expenseResult.total,
      income: incomeResult.total,
      transfer: transferResult.total,
    });
  } catch (error) {
    console.error("Error fetching planned payment counts:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch planned payment counts";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

