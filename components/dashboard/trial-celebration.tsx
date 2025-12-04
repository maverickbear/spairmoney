"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function TrialCelebration() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const trialStarted = searchParams.get("trialStarted");
    
    if (trialStarted === "true") {
      let interval: NodeJS.Timeout | null = null;
      let cleanupTimeout: NodeJS.Timeout | null = null;

      // Dynamically import confetti to avoid SSR issues
      import("canvas-confetti").then((confettiModule) => {
        const confetti = confettiModule.default;
        
        // Trigger confetti animation
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            if (interval) clearInterval(interval);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          
          // Launch confetti from left
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          
          // Launch confetti from right
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);

        // Clean up URL parameter after animation
        cleanupTimeout = setTimeout(() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("trialStarted");
          const newUrl = params.toString() 
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
          router.replace(newUrl);
        }, duration + 500);
      }).catch((error) => {
        console.error("Failed to load confetti:", error);
        // Still clean up URL parameter even if confetti fails
        const params = new URLSearchParams(searchParams.toString());
        params.delete("trialStarted");
        const newUrl = params.toString() 
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        router.replace(newUrl);
      });

      return () => {
        if (interval) clearInterval(interval);
        if (cleanupTimeout) clearTimeout(cleanupTimeout);
      };
    }
  }, [searchParams, router]);

  return null;
}

