/**
 * Landing page analytics: GA4 event tracking for clicks.
 * All landing tracking goes through this helper so we have one naming convention.
 * Events appear in GA4 as "landing_click" with params: section, link_id, destination, interval (optional).
 */

export const LANDING_CLICK_EVENT = "landing_click" as const;

export interface LandingClickParams {
  link_id: string;
  section: string;
  destination?: string;
  interval?: "month" | "year";
}

export function trackLandingClick(params: LandingClickParams): void {
  if (typeof window === "undefined" || !window.gtag) return;
  try {
    window.gtag("event", LANDING_CLICK_EVENT, {
      section: params.section,
      link_id: params.link_id,
      ...(params.destination != null && { destination: params.destination }),
      ...(params.interval != null && { interval: params.interval }),
    });
  } catch {
    // Silently fail - analytics is non-critical
  }
}
