import { makeReportsService } from "@/src/application/reports/reports.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { logger } from "@/src/infrastructure/utils/logger";
import type { ReportPeriod } from "@/components/reports/report-filters";
import type { ReportsData } from "@/src/domain/reports/reports.types";

// Re-export ReportsData type for backward compatibility
export type { ReportsData } from "@/src/domain/reports/reports.types";

// Load reports data with caching
export async function loadReportsData(period: ReportPeriod): Promise<ReportsData> {
  // Get userId and session tokens BEFORE caching (cookies can't be accessed inside unstable_cache)
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get session tokens before entering cache
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = await createServerClient();
    // SECURITY: Use getUser() first to verify authentication, then getSession() for tokens
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Only get session tokens if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        accessToken = session.access_token;
        refreshToken = session.refresh_token;
      }
    }
  } catch (error: any) {
    logger.warn("[Reports] Could not get session tokens:", error?.message);
    // Continue without tokens - service will try to get them itself
  }
  
  // Import cache utilities
  const { withCache, generateCacheKey, CACHE_TAGS } = await import("@/lib/services/cache-manager");
  
  try {
    // Use centralized cache manager with proper tags
    const cacheKey = generateCacheKey.reports({
      userId: userId || undefined,
      period,
    });
    
    const service = makeReportsService();
    
    return await withCache(
      async () => service.getReportsData(userId, period, accessToken, refreshToken),
      {
        key: cacheKey,
        tags: [
          CACHE_TAGS.REPORTS,
          CACHE_TAGS.TRANSACTIONS,
          CACHE_TAGS.ACCOUNTS,
          CACHE_TAGS.BUDGETS,
          CACHE_TAGS.GOALS,
        ],
        revalidate: 300, // 300 seconds (5 minutes) - same as dashboard
      }
    );
  } catch (error) {
    logger.error("[Reports] Error loading data:", error);
    throw error;
  }
}
