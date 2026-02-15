import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { adminEmailSchema } from "@/src/domain/admin/admin.validations";

/**
 * POST /api/v2/admin/invites
 * Body: { email: string }
 * Creates an admin invite (super_admin only). Only @spair.co emails allowed.
 */
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
    const emailParsed = adminEmailSchema.safeParse(rawEmail);
    if (!emailParsed.success) {
      const msg = emailParsed.error.errors[0]?.message ?? "You can't register at this time.";
      return NextResponse.json({ message: msg }, { status: 400 });
    }
    const adminService = makeAdminService();
    const invite = await adminService.createAdminInvite(emailParsed.data, userId);
    return NextResponse.json(invite);
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { message: err.message },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { message: "Failed to create invite" },
      { status: 500 }
    );
  }
}
