import { NextResponse } from "next/server";
import { makePortfolioService } from "@/src/application/portfolio/portfolio.factory";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { guardFeatureAccessReadOnly, getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to investments (read-only - allows cancelled subscriptions)
    const featureGuard = await guardFeatureAccessReadOnly(userId, "hasInvestments");
    if (!featureGuard.allowed) {
      return NextResponse.json(
        { 
          error: featureGuard.error?.message || "Investments are not available in your current plan",
          code: featureGuard.error?.code,
          planError: featureGuard.error,
        },
        { status: 403 }
      );
    }

    // Get session tokens using AuthService
    const { makeAuthService } = await import("@/src/application/auth/auth.factory");
    const authService = makeAuthService();
    const { accessToken, refreshToken } = await authService.getSessionTokens();

    const service = makePortfolioService();
    const accounts = await service.getPortfolioAccounts(accessToken, refreshToken);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching portfolio accounts:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch portfolio accounts" },
      { status: 500 }
    );
  }
}

