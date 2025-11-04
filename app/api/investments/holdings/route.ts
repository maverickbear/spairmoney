import { NextResponse } from "next/server";
import { getHoldings } from "@/lib/api/investments";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const holdings = await getHoldings(accountId || undefined);
    return NextResponse.json(holdings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 });
  }
}

