"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export type LogoVariant = "icon" | "wordmark" | "full";
export type LogoColor = "purple" | "white" | "auto";

interface LogoProps {
  variant?: LogoVariant;
  color?: LogoColor;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  showText?: boolean; // For icon variant, optionally show text next to it
}

/**
 * Logo component for Spare Finance
 * 
 * Variants:
 * - icon: Just the "S" icon (for collapsed nav, small spaces)
 * - wordmark: Full logo with icon and text (same as "full", maintained for compatibility)
 * - full: Full logo with icon and text (default)
 * 
 * Colors:
 * - purple: Purple logo on white background
 * - white: White logo on dark/purple background
 * - auto: Automatically chooses based on theme (defaults to purple)
 */
export function Logo({
  variant = "full",
  color = "auto",
  className,
  width,
  height,
  priority = false,
  showText = false,
}: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  // Track when component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use based on variant and color
  const getLogoPath = () => {
    // Auto mode: detect dark mode and use white logo
    let effectiveColor = color;
    if (color === "auto") {
      // During SSR/initial render, default to purple to match server
      // After mount, use theme to determine color
      if (!mounted) {
        effectiveColor = "purple";
      } else {
        // Use resolvedTheme to handle system theme preference
        const isDark = resolvedTheme === "dark" || theme === "dark";
        effectiveColor = isDark ? "white" : "purple";
      }
    }

    if (variant === "icon") {
      // Icon variant - use new official logomark SVGs
      return effectiveColor === "white"
        ? "/assets/logos/logomark-mono-light.svg" // White icon on dark background
        : "/assets/logos/logomark-primary.svg"; // Green icon for light backgrounds
    }

    if (variant === "wordmark") {
      // Wordmark variant - uses full logo (icon + text)
      return effectiveColor === "white"
        ? "/assets/logos/logo-primary-darkbg.svg" // Full logo with white text for dark backgrounds
        : "/assets/logos/logo-primary-lightbg.svg"; // Full logo with black text for light backgrounds
    }

    // Full variant - use new official full logo SVGs
    if (variant === "full") {
      // For light backgrounds (purple/auto in light mode), use logo with black text
      // For dark backgrounds (white/auto in dark mode), use logo with white text
      return effectiveColor === "white"
        ? "/assets/logos/logo-primary-darkbg.svg" // Full logo with white text for dark backgrounds
        : "/assets/logos/logo-primary-lightbg.svg"; // Full logo with black text for light backgrounds
    }

    // Fallback (should not reach here, but just in case)
    return effectiveColor === "white"
      ? "/assets/logos/logo-primary-darkbg.svg"
      : "/assets/logos/logo-primary-lightbg.svg";
  };

  // Default dimensions based on variant
  const defaultDimensions = {
    icon: { width: 40, height: 40 },
    wordmark: { width: 200, height: 53 },
    full: { width: 240, height: 53 },
  };

  const finalWidth = width ?? defaultDimensions[variant].width;
  const finalHeight = height ?? defaultDimensions[variant].height;

  // Determine effective color for fallback
  let effectiveColorForFallback = color;
  if (color === "auto") {
    // During SSR/initial render, default to purple to match server
    if (!mounted) {
      effectiveColorForFallback = "purple";
    } else {
      const isDark = resolvedTheme === "dark" || theme === "dark";
      effectiveColorForFallback = isDark ? "white" : "purple";
    }
  }

  // Fallback: show text if image fails to load
  if (imgError && variant === "icon") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg",
          effectiveColorForFallback === "white"
            ? "bg-interactive-primary text-white"
            : "bg-interactive-primary/10 text-interactive-primary",
          className
        )}
        style={{ width: finalWidth, height: finalHeight }}
      >
        <span className="text-xl font-bold">S</span>
      </div>
    );
  }

  return (
    <div className={cn("relative flex-shrink-0 flex items-center gap-2", className)}>
      <div 
        className="relative"
        style={{ width: finalWidth, height: finalHeight }}
      >
        <Image
          src={getLogoPath()}
          alt="Spare Finance"
          width={finalWidth}
          height={finalHeight}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="object-contain"
          style={{ width: "100%", height: "100%" }}
          onError={() => setImgError(true)}
        />
      </div>
      {showText && variant === "icon" && (
        <span className="text-xl font-bold">Spare Finance</span>
      )}
    </div>
  );
}

/**
 * Auto Logo component that adapts to theme
 * Uses white variant in dark mode, purple in light mode
 */
export function AutoLogo({
  variant = "full",
  className,
  width,
  height,
  priority = false,
  showText = false,
}: Omit<LogoProps, "color">) {
  return (
    <Logo
      variant={variant}
      color="auto"
      className={className}
      width={width}
      height={height}
      priority={priority}
      showText={showText}
    />
  );
}

