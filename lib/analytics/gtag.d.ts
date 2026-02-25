declare global {
  interface Window {
    gtag?: (command: "event" | "config" | "js", ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export {};
