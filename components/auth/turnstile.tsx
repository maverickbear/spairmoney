"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";

interface TurnstileProps {
  sitekey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}

export interface TurnstileRef {
  reset: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  ({ sitekey, onSuccess, onError, onExpire, theme = "auto" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Expose reset function via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (error) {
            console.error("Error resetting Turnstile widget:", error);
          }
        }
      },
    }));

    useEffect(() => {
      if (!isLoaded || !containerRef.current || !sitekey) {
        return;
      }

      // Clean up previous widget if it exists
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error("Error removing Turnstile widget:", error);
        }
        widgetIdRef.current = null;
      }

      // Render new widget
      if (window.turnstile && containerRef.current) {
        try {
          const widgetId = window.turnstile.render(containerRef.current, {
            sitekey,
            callback: onSuccess,
            "error-callback": onError,
            "expired-callback": onExpire,
            theme,
          });
          widgetIdRef.current = widgetId;
        } catch (error) {
          console.error("Error rendering Turnstile widget:", error);
        }
      }

      // Cleanup function
      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (error) {
            console.error("Error removing Turnstile widget on cleanup:", error);
          }
          widgetIdRef.current = null;
        }
      };
    }, [isLoaded, sitekey, onSuccess, onError, onExpire, theme]);

    if (!sitekey) {
      return null;
    }

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            console.error("Failed to load Turnstile script");
            onError?.();
          }}
        />
        <div ref={containerRef} className="flex justify-center" />
      </>
    );
  }
);

Turnstile.displayName = "Turnstile";

