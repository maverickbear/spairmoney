import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * @deprecated This route is deprecated. Use /api/v2/admin/contact-forms instead.
 * This route will be removed in a future version.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = makeAdminService();
    
    // Check if user is super_admin
    if (!(await service.isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await service.getContactForms({ status, limit, offset });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching contact forms:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contact forms" },
      { status: 500 }
    );
  }
}

/**
 * @deprecated This route is deprecated. Use /api/v2/admin/contact-forms instead.
 * This route will be removed in a future version.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = makeAdminService();
    
    // Check if user is super_admin
    if (!(await service.isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const contactForm = await service.updateContactForm(id, {
      status,
      adminNotes,
    });

    return NextResponse.json({ contactForm });
  } catch (error) {
    console.error("Error updating contact form:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update contact form" },
      { status: 500 }
    );
  }
}

