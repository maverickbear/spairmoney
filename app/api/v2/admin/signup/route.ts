import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { AppError } from "@/src/application/shared/app-error";
import { passwordValidation } from "@/src/domain/auth/auth.validations";
import { adminEmailSchema } from "@/src/domain/admin/admin.validations";

/**
 * POST /api/v2/admin/signup
 * Body: { name, email, password }
 * Registers a new admin (super_admin) with name, email, and password only.
 * Only @spair.co emails are allowed. No invite.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body ?? {};
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const emailParsed = adminEmailSchema.safeParse(String(email).trim());
    if (!emailParsed.success) {
      const msg = emailParsed.error.errors[0]?.message ?? "You can't register at this time.";
      return NextResponse.json({ message: msg }, { status: 400 });
    }

    const parsed = passwordValidation.safeParse(password);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid password";
      return NextResponse.json({ message: msg }, { status: 400 });
    }

    const adminService = makeAdminService();
    await adminService.registerAdminDirect(
      String(name).trim(),
      emailParsed.data,
      password
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { message: err.message },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 400 }
    );
  }
}
