import { NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/seo-settings/public
 * Public endpoint to get SEO settings for landing page
 * No authentication required
 */
export async function GET() {
  try {
    const service = makeAdminService();
    const seoSettings = await service.getPublicSeoSettings();

    return NextResponse.json(seoSettings);
  } catch (error: any) {
    console.error("Error fetching SEO settings:", error);
    // Return defaults if error
    const service = makeAdminService();
    const defaults = await service.getPublicSeoSettings();
    return NextResponse.json(defaults);
  }
}

