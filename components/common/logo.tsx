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
 * Logo component for Spair Money
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
      // For dark/black background use official dark mode PNG (green icon + white text)
      return effectiveColor === "white"
        ? "/assets/spair-money-logo-dark-mode.png" // Official dark mode logo for black background
        : "/assets/logos/logo-primary-lightbg.svg"; // Full logo with black text for light backgrounds
    }

    // Full variant - use new official full logo SVGs
    if (variant === "full") {
      // For light backgrounds (purple/auto in light mode), use logo with black text
      // For dark/black backgrounds (white/auto in dark mode), use official dark mode PNG
      return effectiveColor === "white"
        ? "/assets/spair-money-logo-dark-mode.png" // Official dark mode logo for black background
        : "/assets/logos/logo-primary-lightbg.svg"; // Full logo with black text for light backgrounds
    }

    // Fallback (should not reach here, but just in case)
    return effectiveColor === "white"
      ? "/assets/spair-money-logo-dark-mode.png"
      : "/assets/logos/logo-primary-lightbg.svg";
  };

  // Default dimensions based on variant
  const defaultDimensions = {
    icon: { width: 40, height: 40 },
    wordmark: { width: 200, height: 53 },
    full: { width: 240, height: 53 },
  };

  // If only width is provided, height should be auto
  // If only height is provided, width should be auto
  // If both are provided, use both
  // If neither is provided, use defaults
  const hasWidth = width !== undefined;
  const hasHeight = height !== undefined;
  
  const finalWidth = width ?? defaultDimensions[variant].width;
  const finalHeight = height ?? defaultDimensions[variant].height;

  // Calculate aspect ratio for Next.js Image when one dimension is auto
  // Default aspect ratios based on variant
  const aspectRatios = {
    icon: 1, // Square
    wordmark: 200 / 53, // ~3.77
    full: 240 / 53, // ~4.53
  };
  
  const aspectRatio = aspectRatios[variant];
  
  // For Next.js Image, we need both width and height
  // Calculate the missing dimension based on aspect ratio
  let imageWidth = finalWidth;
  let imageHeight = finalHeight;
  
  if (hasWidth && !hasHeight) {
    // Width provided, height auto - calculate height from aspect ratio
    imageHeight = finalWidth / aspectRatio;
  } else if (!hasWidth && hasHeight) {
    // Height provided, width auto - calculate width from aspect ratio
    imageWidth = finalHeight * aspectRatio;
  }

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
        style={{ 
          width: hasWidth ? finalWidth : undefined,
          height: hasHeight ? finalHeight : undefined,
          ...(hasWidth && !hasHeight ? { height: "auto" } : {}),
          ...(!hasWidth && hasHeight ? { width: "auto" } : {}),
        }}
      >
        <span className="text-xl font-bold">S</span>
      </div>
    );
  }

  return (
    <div className={cn("relative flex-shrink-0 flex items-center gap-2", className)}>
      <div 
        className="relative"
        style={{ 
          width: hasWidth ? finalWidth : "auto",
          height: hasHeight ? finalHeight : "auto",
          ...(hasWidth && !hasHeight ? { height: "auto" } : {}),
          ...(!hasWidth && hasHeight ? { width: "auto" } : {}),
        }}
      >
        <Image
          src={getLogoPath()}
          alt="Spair Money"
          width={imageWidth}
          height={imageHeight}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="object-contain"
          style={{ 
            width: hasWidth ? "100%" : "auto",
            height: hasHeight ? "100%" : "auto",
            ...(hasWidth && !hasHeight ? { height: "auto" } : {}),
            ...(!hasWidth && hasHeight ? { width: "auto" } : {}),
          }}
          onError={() => setImgError(true)}
        />
      </div>
      {showText && variant === "icon" && (
        <span className="text-xl font-bold">Spair Money</span>
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

