import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/admin/system-settings
 * Get current system settings (maintenance mode status)
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

    const settings = await service.getSystemSettings();
    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode || false,
    });
  } catch (error: any) {
    console.error("Error fetching system settings:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch system settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/system-settings
 * Update system settings (maintenance mode)
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
    const { maintenanceMode } = body;

    if (typeof maintenanceMode !== "boolean") {
      return NextResponse.json(
        { error: "maintenanceMode must be a boolean" },
        { status: 400 }
      );
    }

    const settings = await service.updateSystemSettings({ maintenanceMode });
    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode || false,
    });
  } catch (error: any) {
    console.error("Error updating system settings:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to update system settings" },
      { status: 500 }
    );
  }
}

