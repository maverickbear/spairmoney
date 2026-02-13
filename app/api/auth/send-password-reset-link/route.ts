import { NextResponse } from "next/server";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { makeAuthService } from "@/src/application/auth/auth.factory";

/**
 * POST /api/auth/send-password-reset-link
 * Sends a password reset email to the currently logged-in user's email.
 * Used from My Account so the user can change their password via the same
 * link flow as "Forgot password", without entering their current password.
 */
export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to request a password reset link." },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Your account has no email address. Cannot send reset link." },
        { status: 400 }
      );
    }

    const service = makeAuthService();
    const result = await service.requestPasswordReset({ email: user.email });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Check your email for a link to change your password.",
    });
  } catch (error) {
    console.error("[SEND-PASSWORD-RESET-LINK] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
