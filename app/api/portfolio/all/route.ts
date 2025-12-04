import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { guardFeatureAccessReadOnly } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { makePortfolioService } from "@/src/application/portfolio/portfolio.factory";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { logger } from "@/src/infrastructure/utils/logger";

// In-memory cache for request deduplication
// Prevents duplicate calls within a short time window (5 seconds)
// Cache stores the data (not the Response) to avoid ReadableStream lock issues
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds (increased from 2s to catch parallel requests)

// Clean up expired cache entries periodically
function cleanPortfolioCache() {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}

export async function GET(request: Request) {
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

    // Get days parameter from query string
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : 365;

    // OPTIMIZED: Request deduplication - reuse in-flight requests within cache TTL
    const cacheKey = `portfolio-all:${userId}:${days}`;
    const cached = requestCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Reuse in-flight request - get the data and create a new Response
      // This avoids ReadableStream lock issues when multiple requests use the same response
      const cacheAge = now - cached.timestamp;
      logger.log(`[Portfolio All] Cache hit: ${cacheKey}, age: ${cacheAge}ms`);
      const data = await cached.promise;
      return NextResponse.json(data);
    }
    
    if (cached) {
      const cacheAge = now - cached.timestamp;
      logger.log(`[Portfolio All] Cache miss: ${cacheKey}, expired by ${cacheAge - CACHE_TTL}ms`);
    }

    // Clean up expired entries (1% chance to avoid overhead)
    if (Math.random() < 0.01) {
      cleanPortfolioCache();
    }

    // Create new request promise that returns data (not Response)
    // This allows multiple requests to reuse the same data without stream lock issues
    const requestPromise = (async () => {
      const service = makePortfolioService();
      
      // Get all portfolio data in parallel
      // Note: getPortfolioHistoricalData still uses lib/api internally for complex calculations
      const [summary, holdings, accounts, historical] = await Promise.all([
        service.getPortfolioSummaryInternal(accessToken, refreshToken),
        service.getPortfolioHoldings(accessToken, refreshToken),
        service.getPortfolioAccounts(accessToken, refreshToken),
        service.getPortfolioHistoricalData(days, userId),
      ]);

      // Return data object (not NextResponse) to allow reuse without stream lock
      return {
        summary,
        holdings,
        accounts,
        historical,
      };
    })();

    // Store in cache
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: now });
    
    // Clean up after TTL expires
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_TTL);

    // Get data and create a new Response for this request
    const data = await requestPromise;
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error fetching portfolio data:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch portfolio data" },
      { status: 500 }
    );
  }
}

