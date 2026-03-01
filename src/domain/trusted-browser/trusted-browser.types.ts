/**
 * Domain types for trusted browser (skip OTP for 30 days).
 */

export interface TrustedBrowser {
  id: string;
  userId: string;
  fingerprint: string;
  expiresAt: string;
  createdAt: string;
}

export interface RegisterTrustedDeviceInput {
  fingerprint: string;
}

export interface CheckTrustedDeviceInput {
  email: string;
  fingerprint: string;
}

export interface CheckTrustedDeviceResult {
  trusted: boolean;
}
