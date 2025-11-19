"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 🎯 Layout SaaS com Sidebar Fixa + Header Fixo
 * 
 * Estrutura:
 * - Sidebar fixa na esquerda (altura total da tela)
 * - Header fixo no topo, acima do conteúdo
 * - Scroll apenas no container de conteúdo
 * - Conteúdo deslocado horizontalmente pela largura da sidebar
 * - Conteúdo deslocado verticalmente pela altura do header
 */

interface SaasLayoutProps {
  /** Sidebar component */
  sidebar: ReactNode;
  /** Header component */
  header: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Sidebar width when expanded (default: 256px / w-64) */
  sidebarWidth?: number;
  /** Sidebar width when collapsed (default: 64px / w-16) */
  sidebarCollapsedWidth?: number;
  /** Header height (default: 64px / h-16) */
  headerHeight?: number;
  /** Whether sidebar is collapsed */
  isSidebarCollapsed?: boolean;
  /** Additional classes for main content area */
  contentClassName?: string;
}

export function SaasLayout({
  sidebar,
  header,
  children,
  sidebarWidth = 256, // w-64 = 16rem = 256px
  sidebarCollapsedWidth = 64, // w-16 = 4rem = 64px
  headerHeight = 64, // h-16 = 4rem = 64px
  isSidebarCollapsed = false,
  contentClassName,
}: SaasLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set CSS variables for dynamic calculations
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    document.documentElement.style.setProperty('--sidebar-collapsed-width', `${sidebarCollapsedWidth}px`);
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  }, [sidebarWidth, sidebarCollapsedWidth, headerHeight]);

  const currentSidebarWidth = isSidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar - Fixed Left */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r bg-card transition-all duration-300",
          "flex-shrink-0"
        )}
        style={{
          width: `${currentSidebarWidth}px`,
        }}
      >
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{
          marginLeft: `${currentSidebarWidth}px`,
        }}
      >
        {/* Header - Fixed Top */}
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-40 border-b bg-card transition-all duration-300",
            "flex-shrink-0"
          )}
          style={{
            left: `${currentSidebarWidth}px`,
            height: `${headerHeight}px`,
          }}
        >
          {header}
        </header>

        {/* Content Container - Scrollable */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            contentClassName
          )}
          style={{
            marginTop: `${headerHeight}px`,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * 🎯 Hook para gerenciar estado da sidebar
 */
export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
    
    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", {
        detail: { isCollapsed: newState },
      })
    );
  };

  return {
    isCollapsed,
    setIsCollapsed,
    toggle,
  };
}

