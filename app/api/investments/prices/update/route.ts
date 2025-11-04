import { NextResponse } from "next/server";
import { updateAllSecurityPrices, updateSecurityPrice } from "@/lib/api/market-prices";
import { getSecurities } from "@/lib/api/investments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { securityId } = body;

    if (securityId) {
      // Update specific security
      const securities = await getSecurities();
      const security = securities.find((s) => s.id === securityId);
      
      if (!security) {
        return NextResponse.json(
          { error: "Security not found" },
          { status: 404 }
        );
      }

      const price = await updateSecurityPrice(securityId, security.symbol);
      return NextResponse.json({ success: true, price });
    } else {
      // Update all securities
      const result = await updateAllSecurityPrices();
      return NextResponse.json({
        success: true,
        updated: result.updated,
        errors: result.errors,
      });
    }
  } catch (error) {
    console.error("Error updating prices:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update prices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

