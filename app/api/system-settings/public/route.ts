import { NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/system-settings/public
 * Public endpoint to check maintenance mode status
 * No authentication required - used by landing page and login page
 */
export async function GET() {
  try {
    const service = makeAdminService();
    const settings = await service.getPublicSystemSettings();

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error fetching system settings:", error);
    // Return false (no maintenance) if there's an error
    return NextResponse.json({
      maintenanceMode: false,
    });
  }
}

