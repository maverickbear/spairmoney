import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/src/infrastructure/database/supabase-server";
import { sendTrialEndingEmail } from "@/lib/utils/email";
import { logger } from "@/src/infrastructure/utils/logger";

/**
 * Cron job to send trial ending reminder emails (7-day and 2-day).
 * Run daily. Sends when trial_end_date is 5–8 days from now (7-day) or 1–3 days (2-day).
 *
 * Security: Requires Vercel Cron header or CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const vercelCron = request.headers.get("x-vercel-cron");

    const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isVercelCron = !!vercelCron;

    if (!isCronAuth && !isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("[CronTrialEndingReminder] Starting trial ending reminder");

    const supabase = createServiceRoleClient();
    const now = new Date();
    const inFiveDays = new Date(now);
    inFiveDays.setDate(inFiveDays.getDate() + 5);
    const inEightDays = new Date(now);
    inEightDays.setDate(inEightDays.getDate() + 8);
    const inOneDay = new Date(now);
    inOneDay.setDate(inOneDay.getDate() + 1);
    const inThreeDays = new Date(now);
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const sent = { "7day": 0, "2day": 0, errors: 0 };

    // Trialing subscriptions with trial_end_date in 5–8 days (7-day reminder)
    const { data: subs7d, error: err7 } = await supabase
      .from("app_subscriptions")
      .select("id, user_id, trial_end_date")
      .eq("status", "trialing")
      .not("trial_end_date", "is", null)
      .gte("trial_end_date", inFiveDays.toISOString())
      .lte("trial_end_date", inEightDays.toISOString());

    if (err7) {
      logger.error("[CronTrialEndingReminder] Error fetching 7-day subscriptions:", err7);
    } else if (subs7d?.length) {
      for (const sub of subs7d) {
        try {
          const { data: userRow } = await supabase
            .from("users")
            .select("email, name")
            .eq("id", sub.user_id)
            .single();
          if (userRow?.email) {
            await sendTrialEndingEmail({
              to: userRow.email,
              userName: userRow.name ?? undefined,
              trialEndDate: new Date(sub.trial_end_date),
              daysLeft: 7,
              appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://spair.co",
            });
            sent["7day"]++;
          }
        } catch (e) {
          logger.error("[CronTrialEndingReminder] Error sending 7-day reminder:", e);
          sent.errors++;
        }
      }
    }

    // Trialing subscriptions with trial_end_date in 1–3 days (2-day reminder)
    const { data: subs2d, error: err2 } = await supabase
      .from("app_subscriptions")
      .select("id, user_id, trial_end_date")
      .eq("status", "trialing")
      .not("trial_end_date", "is", null)
      .gte("trial_end_date", inOneDay.toISOString())
      .lte("trial_end_date", inThreeDays.toISOString());

    if (err2) {
      logger.error("[CronTrialEndingReminder] Error fetching 2-day subscriptions:", err2);
    } else if (subs2d?.length) {
      for (const sub of subs2d) {
        try {
          const { data: userRow } = await supabase
            .from("users")
            .select("email, name")
            .eq("id", sub.user_id)
            .single();
          if (userRow?.email) {
            const endDate = new Date(sub.trial_end_date);
            const daysLeft = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
            await sendTrialEndingEmail({
              to: userRow.email,
              userName: userRow.name ?? undefined,
              trialEndDate: endDate,
              daysLeft,
              appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://spair.co",
            });
            sent["2day"]++;
          }
        } catch (e) {
          logger.error("[CronTrialEndingReminder] Error sending 2-day reminder:", e);
          sent.errors++;
        }
      }
    }

    logger.info("[CronTrialEndingReminder] Completed:", sent);

    return NextResponse.json({
      success: true,
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[CronTrialEndingReminder] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
