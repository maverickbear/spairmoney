"use client";

import { useBreakpoint } from "@/hooks/use-breakpoint";

/**
 * Component that logs current breakpoint in development mode.
 * Add this to your root layout to see breakpoint changes in console.
 * Only mount in development (see root layout) so production bundle skips it.
 */
export function BreakpointLogger() {
  useBreakpoint();
  return null;
}

