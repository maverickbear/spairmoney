"use client";

import { cn } from "@/lib/utils";

/**
 * Fixed bar shown on mobile only, placed directly above the bottom nav.
 * Use for "Add" actions that are removed from the page header on mobile.
 */
export function MobileAddBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed left-0 right-0 bottom-16 z-40 flex h-auto items-center justify-center px-0 lg:hidden",
        className
      )}
      aria-label="Add action"
    >
      {children}
    </div>
  );
}
