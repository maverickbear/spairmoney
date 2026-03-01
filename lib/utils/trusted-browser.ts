/**
 * Trusted Browser Management
 *
 * Trust is stored in Supabase (trusted_browsers table). When trusted,
 * users skip OTP verification on this device for 30 days.
 */

import { apiUrl } from "@/lib/utils/api-base-url";

/**
 * Generates a simple browser fingerprint (same logic as server-side check).
 * Exported for use when calling the trusted-device API.
 */
export function getBrowserFingerprint(): string {
  if (typeof window === "undefined") return "";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx?.fillText("Browser fingerprint", 2, 2);
  const canvasFingerprint = canvas.toDataURL();

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasFingerprint.substring(0, 50),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}


/**
 * Check if this device is trusted for the given email (Supabase).
 * Used on login to decide whether to skip OTP.
 */
export async function checkTrustedDevice(email: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const fingerprint = getBrowserFingerprint();
  if (!fingerprint) return false;

  try {
    const res = await fetch(apiUrl("/api/v2/auth/trusted-device/check"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), fingerprint }),
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.trusted;
  } catch {
    return false;
  }
}

/**
 * Register this device as trusted for the current user (Supabase).
 * Call after OTP verification when the user checked "Ask again in 30 days".
 */
export async function registerTrustedDevice(): Promise<void> {
  if (typeof window === "undefined") return;
  const fingerprint = getBrowserFingerprint();
  if (!fingerprint) return;

  try {
    const res = await fetch(apiUrl("/api/v2/auth/trusted-device"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
      credentials: "include",
    });
    if (!res.ok) {
      console.warn("[trusted-browser] Failed to register trusted device:", await res.text());
    }
  } catch (err) {
    console.warn("[trusted-browser] Failed to register trusted device:", err);
  }
}



