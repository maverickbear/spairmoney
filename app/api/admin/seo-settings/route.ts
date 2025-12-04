import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/admin/seo-settings
 * Get current SEO settings
 * Only accessible by super_admin
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const service = makeAdminService();
    
    // Check if user is super_admin
    const isSuperAdmin = await service.isSuperAdmin(userId);
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    const seoSettings = await service.getSEOSettings();
    return NextResponse.json(seoSettings);
  } catch (error: any) {
    console.error("Error fetching SEO settings:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch SEO settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/seo-settings
 * Update SEO settings
 * Only accessible by super_admin
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const service = makeAdminService();
    
    // Check if user is super_admin
    const isSuperAdmin = await service.isSuperAdmin(userId);
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const seoSettings = await service.updateSEOSettings(body);

    return NextResponse.json(seoSettings);
  } catch (error: any) {
    console.error("Error updating SEO settings:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}

