/**
 * Hook to measure page load performance for client-side pages
 * Usage:
 *   usePagePerformance("Transactions");
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/utils/logger";

export function usePagePerformance(pageName: string) {
  const pathname = usePathname();
  const startTimeRef = useRef<number | null>(null);
  const hasLoggedRef = useRef(false);
  const log = logger.withPrefix(`PERF-${pageName.toUpperCase()}`);

  useEffect(() => {
    // Reset when pathname changes
    startTimeRef.current = typeof window !== "undefined" ? performance.now() : null;
    hasLoggedRef.current = false;

    if (startTimeRef.current !== null) {
      log.info(`[${pageName}] Starting page load...`);
    }

    return () => {
      // Log on unmount if we haven't logged yet
      if (startTimeRef.current !== null && !hasLoggedRef.current) {
        const endTime = performance.now();
        const duration = endTime - startTimeRef.current;
        log.info(`[${pageName}] Page unloaded (was loaded for ${duration.toFixed(2)}ms)`);
      }
    };
  }, [pathname, pageName, log]);

  return {
    markDataLoaded: () => {
      if (startTimeRef.current !== null && !hasLoggedRef.current) {
        const endTime = performance.now();
        const duration = endTime - startTimeRef.current;
        hasLoggedRef.current = true;
        log.info(`[${pageName}] Page data loaded in ${duration.toFixed(2)}ms`);
      }
    },
    markComplete: () => {
      if (startTimeRef.current !== null && !hasLoggedRef.current) {
        const endTime = performance.now();
        const duration = endTime - startTimeRef.current;
        hasLoggedRef.current = true;
        log.info(`[${pageName}] Page fully loaded in ${duration.toFixed(2)}ms`);
      }
    },
    log: (message: string) => {
      if (startTimeRef.current !== null) {
        const currentTime = performance.now();
        const elapsed = currentTime - startTimeRef.current;
        log.info(`[${pageName}] ${message} (${elapsed.toFixed(2)}ms elapsed)`);
      }
    },
  };
}

