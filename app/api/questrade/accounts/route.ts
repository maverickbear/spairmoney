import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getQuestradeAccounts, decryptTokens, refreshAccessToken, encryptTokens } from "@/lib/api/questrade";
import { getCurrentUserId, guardFeatureAccessReadOnly, throwIfNotAllowed } from "@/lib/api/feature-guard";
import { formatTimestamp } from "@/lib/utils/timestamp";

// Simple in-memory cache for request deduplication
// Prevents duplicate calls within a short time window (5 seconds)
const requestCache = new Map<string, { promise: Promise<NextResponse>; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

// Clean up expired cache entries periodically
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}

export async function GET() {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // OPTIMIZED: Request deduplication - reuse in-flight requests within cache TTL
    const cacheKey = `questrade-accounts:${userId}`;
    const cached = requestCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Reuse in-flight request
      return await cached.promise;
    }

    // Clean up expired entries (1% chance to avoid overhead)
    if (Math.random() < 0.01) {
      cleanCache();
    }

    // Create new request promise
    const requestPromise = fetchQuestradeAccounts(userId);
    
    // Store in cache
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: now });
    
    // Clean up after TTL expires
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_TTL);

    return await requestPromise;
  } catch (error: any) {
    console.error("Error in Questrade accounts GET handler:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Questrade accounts" },
      { status: 500 }
    );
  }
}

async function fetchQuestradeAccounts(userId: string): Promise<NextResponse> {
  try {

    // Check if user has access to investments (read-only - allows cancelled subscriptions)
    const guardResult = await guardFeatureAccessReadOnly(userId, "hasInvestments");
    await throwIfNotAllowed(guardResult);

    const supabase = await createServerClient();

    // Get Questrade connection
    const { data: connection, error: connectionError } = await supabase
      .from("QuestradeConnection")
      .select("*")
      .eq("userId", userId)
      .maybeSingle();

    if (connectionError) {
      console.error("Error fetching Questrade connection:", connectionError);
      return NextResponse.json(
        { error: "Failed to fetch Questrade connection" },
        { status: 500 }
      );
    }

    if (!connection) {
      // No connection exists - return empty accounts array instead of 404
      return NextResponse.json({ accounts: [] });
    }

    // Decrypt tokens
    let accessToken: string;
    let refreshToken: string;
    
    try {
      const decrypted = decryptTokens(
        connection.accessToken,
        connection.refreshToken
      );
      accessToken = decrypted.accessToken;
      refreshToken = decrypted.refreshToken;
      console.log(`[Questrade Accounts] Tokens decrypted successfully. Access token length: ${accessToken.length}`);
    } catch (decryptError: any) {
      console.error(`[Questrade Accounts] Error decrypting tokens:`, decryptError);
      return NextResponse.json(
        { error: "Failed to decrypt Questrade tokens. Please reconnect your account." },
        { status: 500 }
      );
    }

    // Check if token is expired or about to expire
    const expiresAt = new Date(connection.tokenExpiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    console.log(`[Questrade Accounts] Token expires at: ${expiresAt.toISOString()}, Now: ${now.toISOString()}, Needs refresh: ${expiresAt <= fiveMinutesFromNow}`);

    let finalAccessToken = accessToken;
    let finalApiServerUrl = connection.apiServerUrl;

    if (expiresAt <= fiveMinutesFromNow) {
      // Refresh token
      try {
        const tokenResponse = await refreshAccessToken(refreshToken);
        const { encryptedAccessToken, encryptedRefreshToken } = encryptTokens(
          tokenResponse.access_token,
          tokenResponse.refresh_token
        );

        const newExpiresAt = new Date(
          now.getTime() + tokenResponse.expires_in * 1000
        );

        // Update connection
        await supabase
          .from("QuestradeConnection")
          .update({
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            apiServerUrl: tokenResponse.api_server,
            tokenExpiresAt: formatTimestamp(newExpiresAt),
            updatedAt: formatTimestamp(now),
          })
          .eq("id", connection.id);

        finalAccessToken = tokenResponse.access_token;
        finalApiServerUrl = tokenResponse.api_server;
      } catch (error: any) {
        console.error("Error refreshing token:", error);
        throw new Error("Failed to refresh Questrade token");
      }
    }

    // Get accounts from Questrade
    let accountsResponse;
    try {
      accountsResponse = await getQuestradeAccounts(
        finalApiServerUrl,
        finalAccessToken
      );
    } catch (error: any) {
      // If token is invalid, try to refresh it
      if (error.message?.includes('Access token is invalid') || error.message?.includes('1017')) {
        console.log(`[Questrade Accounts] Token invalid, attempting refresh...`);
        try {
          const tokenResponse = await refreshAccessToken(refreshToken);
          const { encryptedAccessToken, encryptedRefreshToken } = encryptTokens(
            tokenResponse.access_token,
            tokenResponse.refresh_token
          );

          const newExpiresAt = new Date(
            now.getTime() + tokenResponse.expires_in * 1000
          );

          // Update connection with new tokens
          await supabase
            .from("QuestradeConnection")
            .update({
              accessToken: encryptedAccessToken,
              refreshToken: encryptedRefreshToken,
              apiServerUrl: tokenResponse.api_server,
              tokenExpiresAt: formatTimestamp(newExpiresAt),
              updatedAt: formatTimestamp(now),
            })
            .eq("id", connection.id);

          // Retry with new token
          accountsResponse = await getQuestradeAccounts(
            tokenResponse.api_server,
            tokenResponse.access_token
          );
        } catch (refreshError: any) {
          console.error(`[Questrade Accounts] Failed to refresh token:`, refreshError);
          throw new Error("Failed to refresh invalid token. Please reconnect your Questrade account.");
        }
      } else {
        throw error;
      }
    }

    // Get connected accounts from database
    const { data: connectedAccounts } = await supabase
      .from("InvestmentAccount")
      .select("id, questradeAccountNumber, isQuestradeConnected")
      .eq("questradeConnectionId", connection.id)
      .eq("isQuestradeConnected", true);

    // Map Questrade accounts with connection status
    const accounts = accountsResponse.accounts.map((account) => {
      const connected = connectedAccounts?.find(
        (ca) => ca.questradeAccountNumber === account.number
      );
      return {
        ...account,
        connected: !!connected,
        accountId: connected?.id || null,
      };
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Error fetching Questrade accounts:", error);

    // Check if it's a plan error
    if (error.planError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          planError: error.planError,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch Questrade accounts" },
      { status: 500 }
    );
  }
}

