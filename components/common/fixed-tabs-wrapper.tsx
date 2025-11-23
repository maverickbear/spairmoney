"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FixedTabsWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper para tabs fixas que ficam abaixo do header
 * Calcula automaticamente a posição baseada na altura dos headers fixos
 */
export function FixedTabsWrapper({ children, className }: FixedTabsWrapperProps) {
  const tabsRef = useRef<HTMLDivElement>(null);

  // Initialize CSS variable with a default value
  useEffect(() => {
    // Set initial value if not already set
    const currentValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--fixed-tabs-height');
    if (!currentValue || currentValue === '0px') {
      document.documentElement.style.setProperty('--fixed-tabs-height', '3.5rem');
    }
  }, []);

  // Update CSS variable for tabs height
  useEffect(() => {
    const updateTabsHeight = () => {
      if (tabsRef.current) {
        const height = tabsRef.current.offsetHeight;
        if (height > 0) {
          const previousHeight = getComputedStyle(document.documentElement)
            .getPropertyValue('--fixed-tabs-height');
          document.documentElement.style.setProperty('--fixed-tabs-height', `${height}px`);
          
          // Dispatch event if height changed to trigger re-renders
          if (previousHeight !== `${height}px`) {
            window.dispatchEvent(new CustomEvent('fixed-tabs-height-changed', {
              detail: { height }
            }));
          }
        }
      }
    };

    // Calculate immediately
    updateTabsHeight();

    // Calculate after a short delay to ensure DOM is ready
    const timeouts = [
      setTimeout(updateTabsHeight, 0),
      setTimeout(updateTabsHeight, 50),
      setTimeout(updateTabsHeight, 100),
      setTimeout(updateTabsHeight, 200),
    ];

    // Use ResizeObserver to watch for size changes
    let resizeObserver: ResizeObserver | null = null;
    if (tabsRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateTabsHeight();
      });
      resizeObserver.observe(tabsRef.current);
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (resizeObserver) {
        resizeObserver.disconnect();
    }
    };
  }, [children]);

  return (
    <div
      ref={tabsRef}
      data-fixed-tabs
      className={cn(
        "sticky z-40 bg-card dark:bg-background border-b border-t-0 px-4 lg:px-8",
        "hidden lg:block", // Only show on desktop
        className
      )}
      style={{
        top: 'var(--page-header-height, 64px)',
      }}
    >
        {children}
    </div>
  );
}

