import { NextRequest, NextResponse } from "next/server";
import { registerTrustedDevice } from "@/src/application/trusted-browser/trusted-browser.factory";
import { registerTrustedDeviceSchema } from "@/src/domain/trusted-browser/trusted-browser.validations";
import { AppError } from "@/src/application/shared/app-error";
import { ZodError } from "zod";

/**
 * POST /api/v2/auth/trusted-device
 * Register the current user's device as trusted (skip OTP for 30 days).
 * Requires authentication (called after OTP verification).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerTrustedDeviceSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error instanceof ZodError
        ? parsed.error.errors.map((e) => e.message).join("; ")
        : "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await registerTrustedDevice(parsed.data.fingerprint);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[trusted-device] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
