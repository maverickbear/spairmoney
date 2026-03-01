import { NextRequest, NextResponse } from "next/server";
import { checkTrustedDevice } from "@/src/application/trusted-browser/trusted-browser.factory";
import { checkTrustedDeviceSchema } from "@/src/domain/trusted-browser/trusted-browser.validations";
import { ZodError } from "zod";

/**
 * POST /api/v2/auth/trusted-device/check
 * Check if the given email has this fingerprint as a trusted device (for login flow).
 * Unauthenticated; used to decide whether to show OTP or use login-trusted.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkTrustedDeviceSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error instanceof ZodError
        ? parsed.error.errors.map((e) => e.message).join("; ")
        : "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const result = await checkTrustedDevice(
      parsed.data.email,
      parsed.data.fingerprint
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[trusted-device/check] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
