/**
 * Cached function to get income basis for goals
 * This ensures income basis calculation is called only once per request
 * Uses Next.js "use cache" directive for Cache Components support
 * 
 * CRITICAL: Added in-memory cache layer to prevent duplicate calls
 * even when Next.js cache doesn't work across different contexts
 * 
 * Income basis calculation is expensive (queries 4 months of transactions)
 * so caching significantly improves performance
 */

import { cacheLife, cacheTag } from "next/cache";
import { makeGoalsService } from "./goals.factory";
import { makeOnboardingService } from "../onboarding/onboarding.factory";
import { getCurrentUserId } from "../shared/feature-guard";
import { logger } from "@/src/infrastructure/utils/logger";

const log = logger.withPrefix("IncomeBasisCache");

// In-memory cache for request-level deduplication
// This works across all contexts (server components, API routes, etc.)
// Maps userId -> { promise: Promise<number>, timestamp: number }
const requestCache = new Map<string, { promise: Promise<number>; timestamp: number }>();

// Cache TTL: Keep promises in cache for 5 seconds to allow concurrent calls to reuse them
const CACHE_TTL = 5000; // 5 seconds

/**
 * Internal cached function keyed by userId and expectedIncome
 * Uses "use cache" directive for Next.js Cache Components
 * 
 * CRITICAL: Added request-level deduplication to prevent duplicate calls
 * even when Next.js cache doesn't work across different execution contexts
 */
async function getIncomeBasisCachedInternal(
  userId: string,
  expectedIncome?: number | null,
  accessToken?: string,
  refreshToken?: string
): Promise<number> {
  "use cache";
  // Create unique cache key combining userId and expectedIncome
  // If expectedIncome is provided, it's used directly (no calculation needed)
  const cacheKey = `income-basis-${userId}-${expectedIncome ?? "calculated"}`;
  cacheTag(cacheKey, "income-basis");
  // Income basis changes when transactions change, use moderate cache times
  cacheLife({ stale: 30, revalidate: 120, expire: 300 });

  // CRITICAL: Check in-memory cache first to prevent duplicate calls
  // This works even when Next.js cache doesn't work across contexts
  const cached = requestCache.get(cacheKey);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    // Only reuse if cache is still fresh (within TTL)
    if (age < CACHE_TTL) {
      log.debug("Using in-memory cached promise (deduplication)", { userId, expectedIncome, age: `${age}ms` });
      try {
        return await cached.promise;
      } catch (error) {
        // If cached promise failed, remove it and continue
        requestCache.delete(cacheKey);
        throw error;
      }
    } else {
      // Cache expired, remove it
      requestCache.delete(cacheKey);
    }
  }

  log.debug("Computing income basis (cache miss)", { userId, expectedIncome });

  // Create new promise: transaction-based first, then fallback to household expected income
  const service = makeGoalsService();
  const dataPromise = (async (): Promise<number> => {
    const fromTransactions = await service.calculateIncomeBasis(
      expectedIncome,
      accessToken,
      refreshToken
    );
    if (fromTransactions > 0) return fromTransactions;

    // Use household expected annual income as fallback for goal forecasts
    const onboardingService = makeOnboardingService();
    const annual = await onboardingService.getExpectedIncomeAmount(
      userId,
      accessToken,
      refreshToken
    );
    if (annual != null && annual > 0) {
      const monthly = onboardingService.getMonthlyIncomeFromAnnual(annual);
      log.debug("Using household expected income as income basis", { annual, monthly });
      return monthly;
    }
    return 0;
  })();

  // Cache the promise with timestamp to deduplicate concurrent calls
  requestCache.set(cacheKey, { promise: dataPromise, timestamp: Date.now() });

  // Clean up after promise resolves (success or failure)
  dataPromise
    .then(() => {
      setTimeout(() => {
        const cached = requestCache.get(cacheKey);
        if (cached && cached.promise === dataPromise) {
          requestCache.delete(cacheKey);
        }
      }, CACHE_TTL);
    })
    .catch(() => {
      const cached = requestCache.get(cacheKey);
      if (cached && cached.promise === dataPromise) {
        requestCache.delete(cacheKey);
      }
    });

  return dataPromise;
}

/**
 * Get income basis for goals (cached per request)
 * Uses "use cache" directive for Next.js Cache Components
 * 
 * @param expectedIncome - Optional expected income value to use instead of calculating from transactions
 * @param accessToken - Optional access token for authentication
 * @param refreshToken - Optional refresh token for authentication
 */
export async function getIncomeBasisForGoals(
  expectedIncome?: number | null,
  accessToken?: string,
  refreshToken?: string
): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return 0;
  }

  // Get tokens if not provided (for direct calls outside cache)
  // This ensures proper authentication when tokens are not explicitly passed
  let finalAccessToken = accessToken;
  let finalRefreshToken = refreshToken;

  if (!finalAccessToken || !finalRefreshToken) {
    try {
      const { createServerClient } = await import("@/src/infrastructure/database/supabase-server");
      const supabase = await createServerClient();
      // SECURITY: Use getUser() first to verify authentication, then getSession() for tokens
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Only get session tokens if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          finalAccessToken = finalAccessToken || session.access_token;
          finalRefreshToken = finalRefreshToken || session.refresh_token;
        }
      }
    } catch (error: any) {
      // If we can't get tokens (e.g., inside unstable_cache), continue without them
      // The createServerClient will try to get from cookies when called
      log.debug("Could not get tokens, will try from cookies:", error?.message);
    }
  }

  return getIncomeBasisCachedInternal(userId, expectedIncome, finalAccessToken, finalRefreshToken);
}

