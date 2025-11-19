"use client";

import { UpgradeBanner } from "@/components/common/upgrade-banner";
import { useEffect, useState } from "react";

interface DesktopHeaderProps {
  hasSubscription?: boolean;
}

export function DesktopHeader({ hasSubscription = true }: DesktopHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Listen for sidebar toggle events
  useEffect(() => {
    // Load initial state from localStorage
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }

    const handleSidebarToggle = (event: CustomEvent<{ isCollapsed: boolean }>) => {
      setIsCollapsed(event.detail.isCollapsed);
    };

    window.addEventListener("sidebar-toggle", handleSidebarToggle as EventListener);

    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle as EventListener);
    };
  }, []);

  // Don't render DesktopHeader if user doesn't have subscription
  if (!hasSubscription) {
    return null;
  }

  return (
    <header 
      className={`hidden lg:block sticky top-0 transition-all duration-300 z-40 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
      id="desktop-header"
    >
      <UpgradeBanner />
    </header>
  );
}

