"use client";

import { useEffect, useState } from "react";

interface FixedTabsSpacerProps {
  className?: string;
  mobile?: boolean;
}

/**
 * Spacer component that reacts to changes in --fixed-tabs-height CSS variable
 * Forces re-render when the variable changes to ensure proper spacing
 * 
 * @param className - CSS classes to apply (default: "hidden lg:block" for desktop)
 * @param mobile - If true, calculates height for mobile tabs (default: false)
 */
export function FixedTabsSpacer({ className = "hidden lg:block", mobile = false }: FixedTabsSpacerProps) {
  const [height, setHeight] = useState(mobile ? "calc(var(--mobile-header-height, 3rem) + 3.5rem + 1rem)" : "3.5rem");

  useEffect(() => {
    const updateHeight = () => {
      if (mobile) {
        // For mobile, calculate based on mobile header height + tabs height
        const mobileHeaderHeight = getComputedStyle(document.documentElement)
          .getPropertyValue('--mobile-header-height') || '3rem';
        const tabsHeight = '3.5rem'; // Mobile tabs are typically this height
        const padding = '1rem';
        setHeight(`calc(${mobileHeaderHeight} + ${tabsHeight} + ${padding})`);
      } else {
        // For desktop, use fixed tabs height
        const computedHeight = getComputedStyle(document.documentElement)
          .getPropertyValue('--fixed-tabs-height') || '3.5rem';
        setHeight(computedHeight);
      }
    };

    // Initial calculation
    updateHeight();

    // Listen for custom event when tabs height changes
    const handleTabsHeightChanged = () => {
      updateHeight();
    };

    // Listen for banner visibility changes (affects mobile header height)
    const handleBannerChange = () => {
      updateHeight();
    };

    // Also listen for the event from FixedTabsWrapper
    window.addEventListener('fixed-tabs-height-changed', handleTabsHeightChanged);
    window.addEventListener('banner-visibility-changed', handleBannerChange);

    // Periodically check for changes (fallback)
    const interval = setInterval(updateHeight, 100);

    // Initial delays to catch early changes
    const timeouts = [
      setTimeout(updateHeight, 0),
      setTimeout(updateHeight, 50),
      setTimeout(updateHeight, 100),
      setTimeout(updateHeight, 200),
    ];

    return () => {
      window.removeEventListener('fixed-tabs-height-changed', handleTabsHeightChanged);
      window.removeEventListener('banner-visibility-changed', handleBannerChange);
      clearInterval(interval);
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [mobile]);

  return <div className={className} style={{ height }} />;
}

