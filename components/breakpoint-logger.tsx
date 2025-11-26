"use client";

import { useBreakpoint } from "@/hooks/use-breakpoint";

/**
 * Component that logs current breakpoint in development mode
 * Add this to your root layout to see breakpoint changes in console
 */
export function BreakpointLogger() {
  useBreakpoint();
  return null; // This component doesn't render anything
}

