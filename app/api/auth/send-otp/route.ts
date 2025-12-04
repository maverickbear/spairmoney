import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/auth/send-otp
 * Sends OTP email to user for email verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log("[SEND-OTP] Request received for email:", email);

    if (!email) {
      console.error("[SEND-OTP] Email is missing");
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const service = makeAuthService();
    const result = await service.sendOtp(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send verification code" },
        { status: 400 }
      );
    }

    console.log("[SEND-OTP] OTP sent successfully to:", email);
    return NextResponse.json({ 
      success: true,
      message: "Verification code sent successfully" 
    });
  } catch (error) {
    console.error("[SEND-OTP] Unexpected error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

