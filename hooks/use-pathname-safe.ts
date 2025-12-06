"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook to safely get pathname, returning null during SSR/prerender
 * This prevents "uncached data accessed" errors during build time
 * 
 * Usage:
 *   const pathname = usePathnameSafe();
 *   if (!pathname) {
 *     // Handle SSR/prerender case
 *     return <div>Loading...</div>;
 *   }
 */
export function usePathnameSafe() {
  const [pathname, setPathname] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Always call usePathname() (hooks must be called unconditionally)
  // The error will be caught by Next.js during build, but we handle it gracefully
  const pathnameFromHook = usePathname();
  
  useEffect(() => {
    // Mark as client-side after mount
    setIsClient(true);
    // Set initial pathname
    setPathname(pathnameFromHook);
  }, [pathnameFromHook]);
  
  // During SSR/prerender (before client-side mount), return null
  // This prevents accessing uncached data during build
  if (!isClient) {
    return null;
  }
  
  return pathname || pathnameFromHook;
}

