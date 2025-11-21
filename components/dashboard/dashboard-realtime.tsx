"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Component that sets up real-time subscriptions for dashboard data
 * Automatically refreshes the dashboard when transactions, budgets, goals, or accounts change
 * 
 * OPTIMIZED: 
 * - Consolidated subscriptions into a single channel (reduces realtime.list_changes calls)
 * - Increased debouncing from 500ms to 2000ms (reduces refresh frequency)
 * - Added lazy loading delay (1s) before creating subscriptions (improves initial load)
 * - Hybrid approach: Realtime for Transaction/Account, Polling for Budget/Goal
 * - Circuit breaker with fallback to polling
 * - Performance logging for monitoring outliers
 */

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  MAX_FAILURES: 5,
  TIMEOUT: 60000, // 1 minute
  SLOW_OPERATION_THRESHOLD: 50, // 50ms
};

// Polling configuration for less critical data
const POLLING_INTERVAL = 30000; // 30 seconds for Budget and Goal

export function DashboardRealtime() {
  const router = useRouter();
  const pathname = usePathname();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const circuitBreakerRef = useRef({
    consecutiveFailures: 0,
    lastFailureTime: 0,
    isOpen: false,
  });

  useEffect(() => {
    // Only set up subscriptions on dashboard page
    if (pathname !== "/dashboard") {
      return;
    }

    // Debounce refresh calls to avoid too many refreshes
    // OPTIMIZED: Increased from 500ms to 2000ms to reduce refresh frequency
    let refreshTimeout: NodeJS.Timeout | null = null;
    const scheduleRefresh = async () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      refreshTimeout = setTimeout(async () => {
        // Only refresh the router - cache invalidation is handled by revalidateTag in API functions
        // This avoids invalidating cache on initial page load
        router.refresh();
      }, 2000); // Debounce for 2000ms (was 500ms)
    };

    // Performance logging for monitoring outliers
    const logPerformance = (operation: string, duration: number) => {
      if (duration > CIRCUIT_BREAKER_CONFIG.SLOW_OPERATION_THRESHOLD) {
        console.warn(`[DashboardRealtime] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }
    };

    // Circuit breaker check
    const checkCircuitBreaker = (): boolean => {
      const now = Date.now();
      const breaker = circuitBreakerRef.current;

      // Reset circuit breaker if timeout has passed
      if (breaker.isOpen && now - breaker.lastFailureTime > CIRCUIT_BREAKER_CONFIG.TIMEOUT) {
        breaker.isOpen = false;
        breaker.consecutiveFailures = 0;
        console.info("[DashboardRealtime] Circuit breaker reset");
        return false;
      }

      return breaker.isOpen;
    };

    // Record failure in circuit breaker
    const recordFailure = () => {
      const breaker = circuitBreakerRef.current;
      breaker.consecutiveFailures++;
      breaker.lastFailureTime = Date.now();

      if (breaker.consecutiveFailures >= CIRCUIT_BREAKER_CONFIG.MAX_FAILURES) {
        breaker.isOpen = true;
        console.warn("[DashboardRealtime] Circuit breaker opened - falling back to polling");
      }
    };

    // Record success in circuit breaker
    const recordSuccess = () => {
      const breaker = circuitBreakerRef.current;
      if (breaker.consecutiveFailures > 0) {
        breaker.consecutiveFailures = Math.max(0, breaker.consecutiveFailures - 1);
      }
    };

    // OPTIMIZED: Hybrid approach - Polling for Budget and Goal (less critical, change less frequently)
    // This reduces load on Realtime system
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        scheduleRefresh();
      }, POLLING_INTERVAL);
    };

    // OPTIMIZED: Lazy loading - wait 1 second before creating subscriptions
    // This improves initial page load performance
    const subscriptionTimeout = setTimeout(() => {
      // Check circuit breaker before creating subscriptions
      if (checkCircuitBreaker()) {
        console.info("[DashboardRealtime] Circuit breaker is open, using polling only");
        startPolling();
        return;
      }

      const startTime = performance.now();

      try {
        // OPTIMIZED: Consolidate critical subscriptions into a single channel
        // Only Transaction and Account use Realtime (change frequently)
        // Budget and Goal use polling (change less frequently)
        subscriptionRef.current = supabase
          .channel("dashboard-critical")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Transaction",
            },
            () => {
              const duration = performance.now() - startTime;
              logPerformance("Transaction change", duration);
              recordSuccess();
              scheduleRefresh();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Account",
            },
            () => {
              const duration = performance.now() - startTime;
              logPerformance("Account change", duration);
              recordSuccess();
              scheduleRefresh();
            }
          )
          .subscribe((status) => {
            const duration = performance.now() - startTime;
            logPerformance("Subscription setup", duration);

            if (status === "SUBSCRIBED") {
              recordSuccess();
              console.info("[DashboardRealtime] Realtime subscriptions active for Transaction and Account");
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              recordFailure();
              console.warn(`[DashboardRealtime] Subscription error: ${status}, falling back to polling`);
              // Fallback to polling if Realtime fails
              startPolling();
            }
          });
      } catch (error) {
        recordFailure();
        console.error("[DashboardRealtime] Error setting up subscriptions:", error);
        // Fallback to polling on error
        startPolling();
      }
    }, 1000); // Wait 1 second before creating subscriptions

    // Start polling for Budget and Goal immediately (after delay)
    const pollingTimeout = setTimeout(() => {
      startPolling();
    }, 1000);

    // Cleanup subscriptions on unmount
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      clearTimeout(subscriptionTimeout);
      clearTimeout(pollingTimeout);
      
      // Cleanup subscription if it was created
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Cleanup polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [router, pathname]);

  // This component doesn't render anything
  return null;
}

