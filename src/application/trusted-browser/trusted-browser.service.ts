/**
 * Trusted Browser Service
 * Business logic for registering and checking trusted devices (skip OTP for 30 days).
 */

import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import * as trustedBrowserRepository from "@/src/infrastructure/database/repositories/trusted-browser.repository";
import { AppError } from "@/src/application/shared/app-error";
import type { CheckTrustedDeviceResult } from "@/src/domain/trusted-browser/trusted-browser.types";

/**
 * Register the current user's device as trusted (called after OTP verification).
 */
export async function registerTrustedDevice(fingerprint: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  await trustedBrowserRepository.upsertTrustedBrowser(userId, fingerprint);
}

/**
 * Check if the given email has this fingerprint as a trusted device (for login flow).
 */
export async function checkTrustedDevice(
  email: string,
  fingerprint: string
): Promise<CheckTrustedDeviceResult> {
  const trusted = await trustedBrowserRepository.isTrustedByEmailAndFingerprint(
    email,
    fingerprint
  );
  return { trusted };
}
