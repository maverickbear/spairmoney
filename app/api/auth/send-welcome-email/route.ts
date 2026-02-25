import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { sendWelcomeEmail } from "@/lib/utils/email";

/**
 * POST /api/auth/send-welcome-email
 * Sends welcome email to user(s) via Resend
 * 
 * Note: Welcome emails are automatically sent when a subscription is created
 * via Stripe webhook. This endpoint is for manual sends or edge cases.
 * 
 * Can be called in two ways:
 * 1. With userId or email: Send to specific user
 * 2. Without userId/email: Send to all users registered 1 day ago (for manual batch sends)
 * 
 * Security:
 * - For cron jobs, Vercel automatically adds a "x-vercel-cron" header
 * - For manual calls, you can add a secret header (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Security check: Allow Vercel cron jobs or check for secret header
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    // If not a Vercel cron, check for secret (optional - remove if you want to allow all calls)
    if (!isVercelCron && expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId, email, testMode } = body;

    const authService = makeAuthService();

    // If userId or email is provided, send to specific user
    if (userId || email) {
      // Test mode: skip database check and send directly
      if (testMode === true) {
        if (!email) {
          return NextResponse.json(
            { error: "Email is required in test mode" },
            { status: 400 }
          );
        }

        console.log("[SEND-WELCOME-EMAIL] Test mode: Sending email without database check");
        await sendWelcomeEmail({
          to: email,
          userName: "", // Not used anymore
        });

        console.log("[SEND-WELCOME-EMAIL] Welcome email sent to (test mode):", email);
        return NextResponse.json({
          success: true,
          message: "Welcome email sent successfully (test mode)",
          email: email,
          testMode: true,
        });
      }

      // Normal mode: check if user exists in database
      let user;
      if (userId) {
        user = await authService.findUserById(userId);
      } else if (email) {
        user = await authService.findUserByEmail(email);
      }

      if (!user) {
        console.error("[SEND-WELCOME-EMAIL] User not found");
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Send welcome email
      await sendWelcomeEmail({
        to: user.email,
        userName: "", // Not used anymore
      });

      console.log("[SEND-WELCOME-EMAIL] Welcome email sent to:", user.email);
      return NextResponse.json({
        success: true,
        message: "Welcome email sent successfully",
        user: { id: user.id, email: user.email },
      });
    }

    // If no userId/email provided, send to all users registered 1 day ago
    // This is useful for cron jobs
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0); // Start of day

    const oneDayAgoEnd = new Date(oneDayAgo);
    oneDayAgoEnd.setHours(23, 59, 59, 999); // End of day

    console.log("[SEND-WELCOME-EMAIL] Looking for users registered between:", {
      from: oneDayAgo.toISOString(),
      to: oneDayAgoEnd.toISOString(),
    });

    const users = await authService.findUsersByDateRange(oneDayAgo, oneDayAgoEnd);

    if (!users || users.length === 0) {
      console.log("[SEND-WELCOME-EMAIL] No users found registered 1 day ago");
      return NextResponse.json({
        success: true,
        message: "No users found registered 1 day ago",
        count: 0,
      });
    }

    // Send welcome emails to all users
    const results = await Promise.allSettled(
      users.map((user) =>
        sendWelcomeEmail({
          to: user.email,
          userName: "", // Not used anymore
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log("[SEND-WELCOME-EMAIL] Batch send complete:", {
      total: users.length,
      successful,
      failed,
    });

    return NextResponse.json({
      success: true,
      message: `Welcome emails sent to ${successful} users`,
      count: {
        total: users.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error("[SEND-WELCOME-EMAIL] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

