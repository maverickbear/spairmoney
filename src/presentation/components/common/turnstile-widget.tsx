"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      ready?: (callback: () => void) => void;
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse?: (widgetId: string) => string | undefined;
    };
  }
}

export interface TurnstileWidgetRef {
  getToken: () => string | null;
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onTokenChange?: (token: string | null) => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ siteKey, onTokenChange, theme = "auto", size = "normal" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    // Load Turnstile script
    useEffect(() => {
      if (typeof window === "undefined") return;

      // Check if script is already loaded
      if (window.turnstile) {
        setIsLoaded(true);
        return;
      }

      // Check if script is already in the DOM (check for both explicit and implicit versions)
      const existingScript = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]'
      );

      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener("load", () => {
          setIsLoaded(true);
        });
        if (window.turnstile) {
          setIsLoaded(true);
        }
        return;
      }

      // Load the script with explicit rendering mode (required for programmatic control)
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setIsLoaded(true);
      };

      script.onerror = () => {
        setIsError(true);
        console.error("Failed to load Cloudflare Turnstile script");
      };

      document.body.appendChild(script);

      return () => {
        // Cleanup: remove script if component unmounts
        // Note: We don't remove it if other instances might be using it
      };
    }, []);

    // Render widget when script is loaded
    useEffect(() => {
      if (!isLoaded || !window.turnstile || !containerRef.current || !siteKey) {
        return;
      }

      // Don't render if already rendered
      if (widgetIdRef.current) {
        return;
      }

      // Use turnstile.ready() if available (recommended for explicit rendering)
      const renderWidget = () => {
        try {
          const id = window.turnstile!.render(containerRef.current!, {
            sitekey: siteKey,
            theme,
            size,
            callback: (token: string) => {
              tokenRef.current = token;
              onTokenChange?.(token);
            },
            "error-callback": (errorCode?: string) => {
              tokenRef.current = null;
              setIsError(true);
              onTokenChange?.(null);
              console.error("[Turnstile] Error:", errorCode);
            },
            "expired-callback": () => {
              tokenRef.current = null;
              onTokenChange?.(null);
            },
          });

          widgetIdRef.current = id;
          setIsError(false);
        } catch (error) {
          console.error("Error rendering Turnstile widget:", error);
          setIsError(true);
        }
      };

      // Use ready() callback if available, otherwise render directly
      if (window.turnstile.ready) {
        window.turnstile.ready(renderWidget);
      } else {
        renderWidget();
      }
    }, [isLoaded, siteKey, theme, size, onTokenChange]);

    // Cleanup widget on unmount
    useEffect(() => {
      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (error) {
            console.error("Error removing Turnstile widget:", error);
          }
        }
      };
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getToken: () => {
        // Try to get token from Turnstile API if available
        if (widgetIdRef.current && window.turnstile?.getResponse) {
          const currentToken = window.turnstile.getResponse(widgetIdRef.current);
          if (currentToken) {
            return currentToken;
          }
        }
        return tokenRef.current;
      },
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
            tokenRef.current = null;
            onTokenChange?.(null);
          } catch (error) {
            console.error("Error resetting Turnstile widget:", error);
          }
        }
      },
    }));

    if (!siteKey) {
      return null;
    }

    if (isError) {
      return (
        <div className="text-sm text-muted-foreground">
          Failed to load security verification. Please refresh the page.
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <div ref={containerRef} className="turnstile-widget" />
      </div>
    );
  }
);

TurnstileWidget.displayName = "TurnstileWidget";

