import { NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";

/**
 * GET /api/seo-settings/public
 * Public endpoint to get SEO settings for landing page.
 * Data is always loaded from the system_seo_settings table (Supabase); no other source.
 * No authentication required.
 */
export async function GET() {
  try {
    const service = makeAdminService();
    const seoSettings = await service.getPublicSeoSettings();
    return NextResponse.json(seoSettings);
  } catch (error: unknown) {
    console.error("Error fetching SEO settings:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

