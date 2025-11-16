/**
 * Performance measurement utilities
 * Used to track page load times and performance metrics
 */

import { logger } from "./logger";

/**
 * Measure performance for server-side pages using Date (for Node.js)
 * Usage:
 *   const perf = startServerPagePerformance("Dashboard");
 *   // ... page logic ...
 *   perf.end();
 */
export function startServerPagePerformance(pageName: string) {
  const startTime = Date.now();
  const log = logger.withPrefix(`PERF-${pageName.toUpperCase()}`);

  log.info(`[${pageName}] Starting page load...`);

  return {
    end: () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      log.info(`[${pageName}] Page loaded in ${duration}ms`);
    },
    log: (message: string) => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      log.info(`[${pageName}] ${message} (${elapsed}ms elapsed)`);
    },
  };
}

