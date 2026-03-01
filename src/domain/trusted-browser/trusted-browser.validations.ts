import { z } from "zod";

export const registerTrustedDeviceSchema = z.object({
  fingerprint: z.string().min(1, "Fingerprint is required").max(500),
});

export const checkTrustedDeviceSchema = z.object({
  email: z.string().email("Invalid email"),
  fingerprint: z.string().min(1, "Fingerprint is required").max(500),
});

export type RegisterTrustedDeviceBody = z.infer<typeof registerTrustedDeviceSchema>;
export type CheckTrustedDeviceBody = z.infer<typeof checkTrustedDeviceSchema>;
