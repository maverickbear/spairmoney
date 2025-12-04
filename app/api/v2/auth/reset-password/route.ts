import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { resetPasswordSchema, ResetPasswordFormData } from "@/src/domain/auth/auth.validations";
import { AppError } from "@/src/application/shared/app-error";
import { ZodError } from "zod";

/**
 * POST /api/v2/auth/reset-password
 * Resets user password after validating with HIBP
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    let data: ResetPasswordFormData;
    try {
      data = resetPasswordSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Reset password using service (includes HIBP validation)
    const service = makeAuthService();
    const result = await service.resetPassword(data);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset password" },
      { status: 500 }
    );
  }
}

