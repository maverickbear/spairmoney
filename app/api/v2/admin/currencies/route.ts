import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { CurrencyRepository } from "@/src/infrastructure/database/repositories/currency.repository";
import { createCurrencySchema, updateCurrencySchema } from "@/src/domain/currency/currency.validations";
import { AppError } from "@/src/application/shared/app-error";
import { z } from "zod";

/**
 * GET /api/v2/admin/currencies
 * List all currencies (for admin). Only super_admin.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminService = makeAdminService();
    if (!(await adminService.isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Forbidden: super_admin only" },
        { status: 403 }
      );
    }

    const repo = new CurrencyRepository();
    const currencies = await repo.listAllForAdmin();
    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("[ADMIN-CURRENCIES] GET error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list currencies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/admin/currencies
 * Create a new currency. Only super_admin.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminService = makeAdminService();
    if (!(await adminService.isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Forbidden: super_admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createCurrencySchema.parse(body);

    const repo = new CurrencyRepository();
    const currency = await repo.create({
      code: validated.code,
      name: validated.name,
      locale: validated.locale,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder,
    });

    return NextResponse.json({ currency }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN-CURRENCIES] POST error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create currency" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v2/admin/currencies
 * Update a currency. Body: { code, name?, locale?, isActive?, sortOrder? }. Only super_admin.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminService = makeAdminService();
    if (!(await adminService.isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Forbidden: super_admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, ...rest } = body;
    if (typeof code !== "string" || code.length !== 3) {
      return NextResponse.json(
        { error: "code is required and must be 3 characters (ISO 4217)" },
        { status: 400 }
      );
    }

    const validated = updateCurrencySchema.parse(rest);

    const repo = new CurrencyRepository();
    const currency = await repo.update(code, {
      name: validated.name,
      locale: validated.locale,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder,
    });

    return NextResponse.json({ currency });
  } catch (error) {
    console.error("[ADMIN-CURRENCIES] PUT error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update currency" },
      { status: 500 }
    );
  }
}
